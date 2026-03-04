"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import {
  getTermFromDate,
  getTermDeadline,
  formatTermLabel,
} from "@/lib/format";

export type TermData = {
  term: number;
  label: string;
  status: "SUBMITTED" | "DRAFT" | "OVERDUE";
  deadline: string;
  totalMva: number;
  salesTotal: number;
  expensesTotal: number;
};

export type YearToDateData = {
  totalSales: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
};

export type DashboardData = {
  allTerms: TermData[];
  yearToDate: YearToDateData;
  currentTerm: number;
  recentTransactions: Awaited<ReturnType<typeof db.transaction.findMany>>;
};

export const getDashboardData = withAuth(async (auth, year: number) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentTerm = getTermFromDate(now);

  // Fetch all transactions for the selected year
  const allTransactions = await db.transaction.findMany({
    where: {
      userId: auth.userId,
      termPeriod: { startsWith: `${year}-` },
    },
    orderBy: { date: "desc" },
  });

  // Fetch all MVA terms for the selected year
  const mvaTerms = await db.mvaTerm.findMany({
    where: { userId: auth.userId, year },
  });

  const mvaTermMap = new Map(mvaTerms.map((t) => [t.term, t]));

  // Build per-term data
  const allTerms: TermData[] = [];
  for (let term = 1; term <= 6; term++) {
    const termPeriod = `${year}-${term}`;
    const termTxs = allTransactions.filter((tx) => tx.termPeriod === termPeriod);

    let salesTotal = 0;
    let expensesTotal = 0;
    for (const tx of termTxs) {
      if (tx.type === "SALE") salesTotal += tx.amountNOK;
      else expensesTotal += tx.amountNOK;
    }

    const mvaTerm = mvaTermMap.get(term);
    const deadline = getTermDeadline(year, term);
    const isPast = deadline < now;
    const isSubmitted = mvaTerm?.status === "SUBMITTED";

    let status: TermData["status"] = "DRAFT";
    if (isSubmitted) {
      status = "SUBMITTED";
    } else if (isPast && (year < currentYear || term < currentTerm)) {
      status = "OVERDUE";
    }

    allTerms.push({
      term,
      label: formatTermLabel(term),
      status,
      deadline: deadline.toISOString(),
      totalMva: mvaTerm?.totalMva ?? 0,
      salesTotal,
      expensesTotal,
    });
  }

  // Year totals
  let totalSales = 0;
  let totalExpenses = 0;
  for (const tx of allTransactions) {
    if (tx.type === "SALE") totalSales += tx.amountNOK;
    else totalExpenses += tx.amountNOK;
  }

  const yearToDate: YearToDateData = {
    totalSales,
    totalExpenses,
    netResult: totalSales - totalExpenses,
    transactionCount: allTransactions.length,
  };

  const recentTransactions = allTransactions.slice(0, 5);

  return {
    allTerms,
    yearToDate,
    currentTerm,
    recentTransactions,
  } as DashboardData;
});
