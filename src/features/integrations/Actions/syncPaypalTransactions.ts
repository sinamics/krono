"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { syncParamsSchema } from "../Schema/integrationSchema";
import { getTermPeriod, calculateAmountNOK } from "@/lib/tax-calculations";
import { getExchangeRate } from "@/features/transactions/Actions/getExchangeRate";

async function getPaypalAccessToken(clientId: string, secret: string): Promise<string> {
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error("Kunne ikke hente PayPal-tilgangstoken.");
  }

  const data = await res.json();
  return data.access_token;
}

type PaypalTransaction = {
  transaction_info: {
    transaction_id: string;
    transaction_event_code: string;
    transaction_status: string;
    transaction_amount: {
      currency_code: string;
      value: string;
    };
    fee_amount?: {
      currency_code: string;
      value: string;
    };
    transaction_initiation_date: string;
    transaction_subject?: string;
    transaction_note?: string;
  };
  payer_info?: {
    payer_name?: {
      alternate_full_name?: string;
    };
    email_address?: string;
  };
};

type PaypalSearchResponse = {
  transaction_details: PaypalTransaction[];
  total_pages: number;
  page: number;
};

const PAYMENT_EVENT_CODES = new Set([
  "T0001", // Website payment
  "T0003", // Preapproved payment
  "T0006", // Express Checkout
  "T0007", // Website Payments Standard
  "T0011", // Web Accept
  "T0012", // Auction Payment
]);

export const syncPaypalTransactions = withAuth(
  async (auth, formData: unknown) => {
    const { from, to } = syncParamsSchema.parse(formData);

    const integration = await db.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "paypal",
        },
      },
    });

    if (!integration || !integration.isActive) {
      throw new Error("PayPal er ikke tilkoblet.");
    }

    const { clientId, secret } = JSON.parse(integration.apiKey);
    const accessToken = await getPaypalAccessToken(clientId, secret);

    // PayPal limits to 31-day windows, chunk the date range
    const chunks: { start: Date; end: Date }[] = [];
    let chunkStart = new Date(from);
    while (chunkStart < to) {
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkEnd.getDate() + 31);
      if (chunkEnd > to) chunkEnd.setTime(to.getTime());
      chunks.push({ start: new Date(chunkStart), end: new Date(chunkEnd) });
      chunkStart = new Date(chunkEnd);
    }

    // Fetch all PayPal transactions
    const allTransactions: PaypalTransaction[] = [];

    for (const chunk of chunks) {
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const params = new URLSearchParams({
          start_date: chunk.start.toISOString(),
          end_date: chunk.end.toISOString(),
          fields: "all",
          page_size: "500",
          page: String(page),
        });

        const res = await fetch(
          `https://api-m.paypal.com/v1/reporting/transactions?${params}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`PayPal API-feil: ${res.status} ${errText}`);
        }

        const data: PaypalSearchResponse = await res.json();
        allTransactions.push(...(data.transaction_details || []));
        totalPages = data.total_pages || 1;
        page++;
      }
    }

    // Filter: only successful, incoming payments (positive amount = money received)
    const validTransactions = allTransactions.filter(
      (t) =>
        t.transaction_info.transaction_status === "S" &&
        PAYMENT_EVENT_CODES.has(t.transaction_info.transaction_event_code) &&
        parseFloat(t.transaction_info.transaction_amount.value) > 0
    );

    // Pre-fetch existing externalIds for deduplication
    const txIds = validTransactions.flatMap((t) => [
      `pp_${t.transaction_info.transaction_id}`,
      `ppfee_${t.transaction_info.transaction_id}`,
    ]);

    const existing = await db.transaction.findMany({
      where: {
        userId: auth.userId,
        externalId: { in: txIds },
      },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((t) => t.externalId));

    // Find or create PayPal supplier for fees
    let paypalSupplier = await db.supplier.findFirst({
      where: {
        userId: auth.userId,
        name: "PayPal",
        type: "FOREIGN",
      },
    });

    if (!paypalSupplier) {
      paypalSupplier = await db.supplier.create({
        data: {
          userId: auth.userId,
          name: "PayPal",
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

    for (const tx of validTransactions) {
      const info = tx.transaction_info;
      const saleId = `pp_${info.transaction_id}`;
      const feeId = `ppfee_${info.transaction_id}`;

      if (existingIds.has(saleId) && existingIds.has(feeId)) {
        skipped++;
        continue;
      }

      try {
        const txDate = new Date(info.transaction_initiation_date);
        const termPeriod = getTermPeriod(txDate);
        const amount = Math.abs(parseFloat(info.transaction_amount.value));
        const currency = info.transaction_amount.currency_code;
        const description =
          info.transaction_subject ||
          info.transaction_note ||
          tx.payer_info?.payer_name?.alternate_full_name ||
          "PayPal-betaling";

        const feeValue = info.fee_amount
          ? Math.abs(parseFloat(info.fee_amount.value))
          : 0;
        const feeCurrency = info.fee_amount?.currency_code ?? currency;

        // Fetch exchange rate for non-NOK currencies
        const exchangeRate = currency === "NOK"
          ? 1
          : (await getExchangeRate(currency, txDate)) ?? 1;
        const feeExchangeRate = feeCurrency === "NOK"
          ? 1
          : feeCurrency === currency
            ? exchangeRate
            : (await getExchangeRate(feeCurrency, txDate)) ?? 1;

        const operations = [];

        if (!existingIds.has(saleId)) {
          operations.push(
            db.transaction.create({
              data: {
                userId: auth.userId,
                date: txDate,
                description,
                amount,
                currency,
                exchangeRate,
                amountNOK: calculateAmountNOK(amount, exchangeRate),
                type: "SALE",
                mvaCode: "CODE_52",
                termPeriod,
                externalId: saleId,
              },
            })
          );
        }

        if (!existingIds.has(feeId) && feeValue > 0) {
          operations.push(
            db.transaction.create({
              data: {
                userId: auth.userId,
                date: txDate,
                description: `PayPal-gebyr: ${description}`,
                amount: feeValue,
                currency: feeCurrency,
                exchangeRate: feeExchangeRate,
                amountNOK: calculateAmountNOK(feeValue, feeExchangeRate),
                type: "EXPENSE",
                mvaCode: "CODE_86",
                supplierId: paypalSupplier.id,
                termPeriod,
                externalId: feeId,
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
        const message = err instanceof Error ? err.message : "Ukjent feil";
        errors.push(`${info.transaction_id}: ${message}`);
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
