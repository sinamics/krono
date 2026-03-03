"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import {
  getTermFromDate,
  getTermDeadline,
  formatTermLabel,
} from "@/lib/format";

export type DashboardStatsData = {
  salesTotal: number;
  expensesTotal: number;
  mvaPosition: number;
  nextDeadline: string;
  currentTermLabel: string;
  termStatus: string;
};

export const getDashboardData = withAuth(async (auth) => {
  const now = new Date();
  const year = now.getFullYear();
  const term = getTermFromDate(now);
  const termPeriod = `${year}-${term}`;

  const transactions = await db.transaction.findMany({
    where: { userId: auth.userId, termPeriod },
    orderBy: { date: "desc" },
  });

  let salesTotal = 0;
  let expensesTotal = 0;

  for (const tx of transactions) {
    if (tx.type === "SALE") salesTotal += tx.amountNOK;
    else expensesTotal += tx.amountNOK;
  }

  const mvaTerm = await db.mvaTerm.findUnique({
    where: {
      userId_year_term: { userId: auth.userId, year, term },
    },
  });

  const deadline = getTermDeadline(year, term);

  const stats: DashboardStatsData = {
    salesTotal,
    expensesTotal,
    mvaPosition: mvaTerm?.totalMva ?? 0,
    nextDeadline: deadline.toISOString(),
    currentTermLabel: `Termin ${term} (${formatTermLabel(term)})`,
    termStatus: mvaTerm?.status ?? "DRAFT",
  };

  const recentTransactions = transactions.slice(0, 5);

  return { stats, recentTransactions };
});
