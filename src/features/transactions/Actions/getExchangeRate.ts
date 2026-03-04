"use server";

import { format, subDays } from "date-fns";

export async function getExchangeRate(currency: string, date: Date): Promise<number | null> {
  if (currency === "NOK") return 1;

  // Fetch a 7-day window ending on the given date to handle weekends/holidays
  const endDate = format(date, "yyyy-MM-dd");
  const startDate = format(subDays(date, 7), "yyyy-MM-dd");

  const url = `https://data.norges-bank.no/api/data/EXR/B.${currency}.NOK.SP?startPeriod=${startDate}&endPeriod=${endDate}&format=sdmx-json&locale=no`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = await res.json();
    const series = json?.data?.dataSets?.[0]?.series?.["0:0:0:0"];
    if (!series?.observations) return null;

    // Get the last observation (closest to the requested date)
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
