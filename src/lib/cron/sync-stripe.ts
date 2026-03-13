import Stripe from "stripe";
import { CronJob } from "cron";
import { db } from "@/lib/db";
import { getTermPeriod } from "@/lib/format";
import { getNextBilagsnummer } from "@/lib/bilagsnummer";

async function syncStripeForOrg(integration: {
  id: string;
  organizationId: string;
  apiKey: string;
  lastSyncAt: Date | null;
}) {
  const stripe = new Stripe(integration.apiKey);
  const now = new Date();

  // Start from lastSyncAt, or Jan 1 this year if never synced
  const from =
    integration.lastSyncAt ??
    new Date(now.getFullYear(), 0, 1);

  const charges: Stripe.Charge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.charges.list({
      created: {
        gte: Math.floor(from.getTime() / 1000),
        lte: Math.floor(now.getTime() / 1000),
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

  const validCharges = charges.filter(
    (c) => c.status === "succeeded" && !c.refunded
  );

  if (validCharges.length === 0) {
    await db.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: now },
    });
    return { imported: 0, skipped: 0 };
  }

  const chargeIds = validCharges.flatMap((c) => [c.id, `fee_${c.id}`]);
  const existing = await db.transaction.findMany({
    where: { organizationId: integration.organizationId, externalId: { in: chargeIds } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((t) => t.externalId));

  let stripeSupplier = await db.supplier.findFirst({
    where: { organizationId: integration.organizationId, name: "Stripe", type: "FOREIGN" },
  });
  if (!stripeSupplier) {
    stripeSupplier = await db.supplier.create({
      data: {
        organizationId: integration.organizationId,
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
  let nextBilagsnummer = await getNextBilagsnummer(integration.organizationId);

  for (const charge of validCharges) {
    const saleId = charge.id;
    const feeId = `fee_${charge.id}`;

    if (existingIds.has(saleId) && existingIds.has(feeId)) {
      skipped++;
      continue;
    }

    try {
      const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction | null;
      const chargeDate = new Date(charge.created * 1000);
      const termPeriod = getTermPeriod(chargeDate);
      const amount = charge.amount / 100;
      const currency = charge.currency.toUpperCase();
      const exchangeRate = balanceTx?.exchange_rate ?? 1;
      const amountNOK = amount * exchangeRate;
      const settlementCurrency = balanceTx?.currency?.toUpperCase() ?? "NOK";
      const feeAmount = balanceTx ? balanceTx.fee / 100 : 0;
      const feeAmountNOK =
        settlementCurrency === "NOK" ? feeAmount : feeAmount * exchangeRate;
      const description =
        charge.description || charge.payment_intent?.toString() || "Stripe-betaling";

      const operations = [];

      if (!existingIds.has(saleId)) {
        operations.push(
          db.transaction.create({
            data: {
              organizationId: integration.organizationId,
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
              bilagsnummer: nextBilagsnummer++,
            },
          })
        );
      }

      if (!existingIds.has(feeId) && feeAmount > 0) {
        operations.push(
          db.transaction.create({
            data: {
              organizationId: integration.organizationId,
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
              bilagsnummer: nextBilagsnummer++,
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
      console.error(`[cron:stripe] Failed to import charge ${charge.id}:`, err);
    }
  }

  await db.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: now },
  });

  return { imported, skipped };
}

/** Syncs Stripe transactions for all active integrations. Runs 1st of every month at 02:00 UTC. */
export function syncStripe() {
  const job = new CronJob("0 2 1 * *", async () => {
    try {
      const integrations = await db.integration.findMany({
        where: { provider: "stripe", isActive: true },
      });

      for (const integration of integrations) {
        try {
          const result = await syncStripeForOrg(integration);
          if (result.imported > 0) {
            // biome-ignore lint/suspicious/noConsole: intentional cron job logging
            console.info(
              `[cron:stripe] Org ${integration.organizationId}: ${result.imported} imported, ${result.skipped} skipped`
            );
          }
        } catch (err) {
          console.error(
            `[cron:stripe] Failed for org ${integration.organizationId}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("[cron:stripe] Job failed:", err);
    }
  });

  job.start();
  // biome-ignore lint/suspicious/noConsole: intentional cron job logging
  console.info("[cron:stripe] Scheduled: 1st of every month at 02:00 UTC");
}
