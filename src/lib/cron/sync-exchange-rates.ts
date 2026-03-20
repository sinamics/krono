import { CronJob } from "cron";
import { format, subDays } from "date-fns";
import { db } from "@/lib/db";

async function fetchRate(
  currency: string,
  date: Date
): Promise<number | null> {
  if (currency === "NOK") return 1;

  const endDate = format(date, "yyyy-MM-dd");
  const startDate = format(subDays(date, 7), "yyyy-MM-dd");

  const url = `https://data.norges-bank.no/api/data/EXR/B.${currency}.NOK.SP?startPeriod=${startDate}&endPeriod=${endDate}&format=sdmx-json&locale=no`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const series = json?.data?.dataSets?.[0]?.series?.["0:0:0:0"];
    if (!series?.observations) return null;

    const keys = Object.keys(series.observations).sort(
      (a, b) => Number(b) - Number(a)
    );
    if (keys.length === 0) return null;

    const value = parseFloat(series.observations[keys[0]][0]);
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

/** Fixes placeholder exchange rates for non-NOK transactions. Runs daily at 06:00 UTC. */
export function syncExchangeRates() {
  const job = new CronJob("0 6 * * *", async () => {
    try {
      // biome-ignore lint/suspicious/noConsole: intentional cron job logging
      console.info("[cron] Exchange rate sync started");

      const transactions = await db.transaction.findMany({
        where: {
          currency: { not: "NOK" },
          exchangeRate: 1,
          deletedAt: null,
        },
      });

      let fixed = 0;

      for (const tx of transactions) {
        try {
          const rate = await fetchRate(tx.currency, new Date(tx.date));
          if (!rate) continue;

          await db.transaction.update({
            where: { id: tx.id },
            data: {
              exchangeRate: rate,
              amountNOK: tx.amount * rate,
            },
          });
          fixed++;
        } catch (err) {
          console.error(
            `[cron:exchange-rates] Failed to update tx ${tx.id}:`,
            err
          );
        }
      }

      // biome-ignore lint/suspicious/noConsole: intentional cron job logging
      console.info(
        `[cron:exchange-rates] Done: ${fixed} of ${transactions.length} transactions fixed`
      );
    } catch (err) {
      console.error("[cron:exchange-rates] Job failed:", err);
    }
  });

  job.start();
  // biome-ignore lint/suspicious/noConsole: intentional cron job logging
  console.info(
    "[cron:exchange-rates] Scheduled: daily at 06:00 UTC"
  );
}
