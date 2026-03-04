"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { getExchangeRate } from "./getExchangeRate";

export const fixExchangeRates = withAuth(async (auth) => {
  const transactions = await db.transaction.findMany({
    where: {
      userId: auth.userId,
      currency: { not: "NOK" },
      exchangeRate: 1,
      deletedAt: null,
    },
  });

  let fixed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    try {
      const rate = await getExchangeRate(tx.currency, new Date(tx.date));
      if (!rate) {
        skipped++;
        continue;
      }

      await db.transaction.update({
        where: { id: tx.id },
        data: {
          exchangeRate: rate,
          amountNOK: tx.amount * rate,
        },
      });
      fixed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukjent feil";
      errors.push(`${tx.description}: ${message}`);
    }
  }

  return { fixed, skipped, total: transactions.length, errors };
});
