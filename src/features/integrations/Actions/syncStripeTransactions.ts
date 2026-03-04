"use server";

import Stripe from "stripe";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { getTermPeriod } from "@/lib/format";
import { syncParamsSchema } from "../Schema/integrationSchema";
import { getNextBilagsnummer } from "@/lib/bilagsnummer";

export const syncStripeTransactions = withAuth(
  async (auth, formData: unknown) => {
    const { from, to } = syncParamsSchema.parse(formData);

    const integration = await db.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "stripe",
        },
      },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Stripe er ikke tilkoblet.");
    }

    const stripe = new Stripe(integration.apiKey);

    // Fetch all charges in date range with pagination
    const charges: Stripe.Charge[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const response = await stripe.charges.list({
        created: {
          gte: Math.floor(from.getTime() / 1000),
          lte: Math.floor(to.getTime() / 1000),
        },
        limit: 100,
        expand: ["data.balance_transaction"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      charges.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    // Filter to successful, non-refunded charges
    const validCharges = charges.filter(
      (c) => c.status === "succeeded" && !c.refunded
    );

    // Pre-fetch existing external IDs for deduplication
    const chargeIds = validCharges.flatMap((c) => [c.id, `fee_${c.id}`]);
    const existing = await db.transaction.findMany({
      where: {
        userId: auth.userId,
        externalId: { in: chargeIds },
      },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((t) => t.externalId));

    // Find or create Stripe supplier
    let stripeSupplier = await db.supplier.findFirst({
      where: {
        userId: auth.userId,
        name: "Stripe",
        type: "FOREIGN",
      },
    });

    if (!stripeSupplier) {
      stripeSupplier = await db.supplier.create({
        data: {
          userId: auth.userId,
          name: "Stripe",
          country: "Irland",
          currency: "EUR",
          type: "FOREIGN",
          defaultMvaCode: "CODE_86",
        },
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const charge of validCharges) {
      const saleId = charge.id;
      const feeId = `fee_${charge.id}`;

      if (existingIds.has(saleId) && existingIds.has(feeId)) {
        skipped++;
        continue;
      }

      try {
        const balanceTx = charge.balance_transaction as
          | Stripe.BalanceTransaction
          | null;
        const chargeDate = new Date(charge.created * 1000);
        const termPeriod = getTermPeriod(chargeDate);
        const amount = charge.amount / 100;
        const currency = charge.currency.toUpperCase();
        const exchangeRate = balanceTx?.exchange_rate ?? 1;
        const amountNOK = amount * exchangeRate;
        const settlementCurrency = balanceTx?.currency?.toUpperCase() ?? "NOK";
        const feeAmount = balanceTx ? balanceTx.fee / 100 : 0;
        // Fee is already in settlement currency — don't double-convert
        const feeAmountNOK =
          settlementCurrency === "NOK" ? feeAmount : feeAmount * exchangeRate;
        const description =
          charge.description || charge.payment_intent?.toString() || "Stripe-betaling";

        const operations = [];

        if (!existingIds.has(saleId)) {
          const bilagsnummer = await getNextBilagsnummer(auth.userId);
          operations.push(
            db.transaction.create({
              data: {
                userId: auth.userId,
                date: chargeDate,
                description,
                amount,
                currency,
                exchangeRate,
                amountNOK,
                type: "SALE",
                mvaCode: "CODE_52",
                termPeriod,
                externalId: saleId,
                bilagsnummer,
              },
            })
          );
        }

        if (!existingIds.has(feeId) && feeAmount > 0) {
          const bilagsnummer = await getNextBilagsnummer(auth.userId);
          operations.push(
            db.transaction.create({
              data: {
                userId: auth.userId,
                date: chargeDate,
                description: `Stripe-gebyr: ${description}`,
                amount: feeAmount,
                currency: settlementCurrency,
                exchangeRate: settlementCurrency === "NOK" ? 1 : exchangeRate,
                amountNOK: feeAmountNOK,
                type: "EXPENSE",
                mvaCode: "CODE_86",
                supplierId: stripeSupplier.id,
                termPeriod,
                externalId: feeId,
                bilagsnummer,
              },
            })
          );
        }

        if (operations.length > 0) {
          await db.$transaction(operations);
          imported++;
        } else {
          skipped++;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ukjent feil";
        errors.push(`${charge.id}: ${message}`);
      }
    }

    // Update lastSyncAt
    await db.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return { imported, skipped, errors };
  }
);
