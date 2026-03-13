import { CronJob } from "cron";
import { db } from "@/lib/db";
import { getTermPeriod, calculateAmountNOK } from "@/lib/tax-calculations";
import { getExchangeRate } from "@/features/transactions/Actions/getExchangeRate";
import { getNextBilagsnummer } from "@/lib/bilagsnummer";

type PaypalTransaction = {
  transaction_info: {
    transaction_id: string;
    transaction_event_code: string;
    transaction_status: string;
    transaction_amount: { currency_code: string; value: string };
    fee_amount?: { currency_code: string; value: string };
    transaction_initiation_date: string;
    transaction_subject?: string;
    transaction_note?: string;
  };
  payer_info?: {
    payer_name?: { alternate_full_name?: string };
    email_address?: string;
  };
};

type PaypalSearchResponse = {
  transaction_details: PaypalTransaction[];
  total_pages: number;
  page: number;
};

const PAYMENT_EVENT_CODES = new Set([
  "T0001", "T0003", "T0006", "T0007", "T0011", "T0012",
]);

async function getPaypalAccessToken(clientId: string, secret: string): Promise<string> {
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Could not get PayPal access token");
  const data = await res.json();
  return data.access_token;
}

async function syncPaypalForUser(integration: {
  id: string;
  userId: string;
  apiKey: string;
  lastSyncAt: Date | null;
}) {
  const { clientId, secret } = JSON.parse(integration.apiKey);
  const accessToken = await getPaypalAccessToken(clientId, secret);
  const now = new Date();

  // Start from lastSyncAt, or Jan 1 this year if never synced
  const from = integration.lastSyncAt ?? new Date(now.getFullYear(), 0, 1);

  // Chunk into 31-day windows (PayPal API limitation)
  const chunks: { start: Date; end: Date }[] = [];
  let chunkStart = new Date(from);
  while (chunkStart < now) {
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setDate(chunkEnd.getDate() + 31);
    if (chunkEnd > now) chunkEnd.setTime(now.getTime());
    chunks.push({ start: new Date(chunkStart), end: new Date(chunkEnd) });
    chunkStart = new Date(chunkEnd);
  }

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
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`PayPal API error: ${res.status} ${errText}`);
      }
      const data: PaypalSearchResponse = await res.json();
      allTransactions.push(...(data.transaction_details || []));
      totalPages = data.total_pages || 1;
      page++;
    }
  }

  const validTransactions = allTransactions.filter(
    (t) =>
      t.transaction_info.transaction_status === "S" &&
      PAYMENT_EVENT_CODES.has(t.transaction_info.transaction_event_code) &&
      parseFloat(t.transaction_info.transaction_amount.value) > 0
  );

  if (validTransactions.length === 0) {
    await db.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: now },
    });
    return { imported: 0, skipped: 0 };
  }

  const txIds = validTransactions.flatMap((t) => [
    `pp_${t.transaction_info.transaction_id}`,
    `ppfee_${t.transaction_info.transaction_id}`,
  ]);
  const existing = await db.transaction.findMany({
    where: { userId: integration.userId, externalId: { in: txIds } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((t) => t.externalId));

  let paypalSupplier = await db.supplier.findFirst({
    where: { userId: integration.userId, name: "PayPal", type: "FOREIGN" },
  });
  if (!paypalSupplier) {
    paypalSupplier = await db.supplier.create({
      data: {
        userId: integration.userId,
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
  let nextBilagsnummer = await getNextBilagsnummer(integration.userId);

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

      const exchangeRate =
        currency === "NOK" ? 1 : (await getExchangeRate(currency, txDate)) ?? 1;
      const feeExchangeRate =
        feeCurrency === "NOK"
          ? 1
          : feeCurrency === currency
            ? exchangeRate
            : (await getExchangeRate(feeCurrency, txDate)) ?? 1;

      const operations = [];

      if (!existingIds.has(saleId)) {
        operations.push(
          db.transaction.create({
            data: {
              userId: integration.userId,
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
              bilagsnummer: nextBilagsnummer++,
            },
          })
        );
      }

      if (!existingIds.has(feeId) && feeValue > 0) {
        operations.push(
          db.transaction.create({
            data: {
              userId: integration.userId,
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
      console.error(`[cron:paypal] Failed to import ${info.transaction_id}:`, err);
    }
  }

  await db.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: now },
  });

  return { imported, skipped };
}

/** Syncs PayPal transactions for all active integrations. Runs 1st of every month at 03:00 UTC. */
export function syncPaypal() {
  const job = new CronJob("0 3 1 * *", async () => {
    try {
      const integrations = await db.integration.findMany({
        where: { provider: "paypal", isActive: true },
      });

      for (const integration of integrations) {
        try {
          const result = await syncPaypalForUser(integration);
          if (result.imported > 0) {
            console.log(
              `[cron:paypal] User ${integration.userId}: ${result.imported} imported, ${result.skipped} skipped`
            );
          }
        } catch (err) {
          console.error(
            `[cron:paypal] Failed for user ${integration.userId}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("[cron:paypal] Job failed:", err);
    }
  });

  job.start();
  console.log("[cron:paypal] Scheduled: 1st of every month at 03:00 UTC");
}
