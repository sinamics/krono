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
  missingSuppliers: { id: string; name: string }[];
};

export type YearToDateData = {
  totalSales: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
};

export type MonthlyData = {
  month: string;
  sales: number;
  expenses: number;
};

export type DashboardData = {
  allTerms: TermData[];
  yearToDate: YearToDateData;
  currentTerm: number;
  recentTransactions: Awaited<ReturnType<typeof db.transaction.findMany>>;
  monthly: MonthlyData[];
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
      deletedAt: null,
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
  const supplierSets: Map<number, Set<string>> = new Map();

  for (let term = 1; term <= 6; term++) {
    const termPeriod = `${year}-${term}`;
    const termTxs = allTransactions.filter((tx) => tx.termPeriod === termPeriod);

    let salesTotal = 0;
    let expensesTotal = 0;
    const supplierIds = new Set<string>();
    for (const tx of termTxs) {
      if (tx.type === "SALE") salesTotal += tx.amountNOK;
      else expensesTotal += tx.amountNOK;
      if (tx.supplierId) supplierIds.add(tx.supplierId);
    }
    supplierSets.set(term, supplierIds);

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
      missingSuppliers: [],
    });
  }

  // Compute missing suppliers: for terms 2–6, find suppliers in prev term but not in current
  const allMissingIds = new Set<string>();
  for (let i = 1; i < allTerms.length; i++) {
    if (allTerms[i].status === "SUBMITTED") continue;
    const prevSet = supplierSets.get(i)!; // term i (1-indexed), index i-1
    const currSet = supplierSets.get(i + 1)!;
    const missing: string[] = [];
    for (const id of prevSet) {
      if (!currSet.has(id)) {
        missing.push(id);
        allMissingIds.add(id);
      }
    }
    if (missing.length > 0) {
      allTerms[i].missingSuppliers = missing.map((id) => ({ id, name: id }));
    }
  }

  // Resolve supplier names in one query
  if (allMissingIds.size > 0) {
    const suppliers = await db.supplier.findMany({
      where: { id: { in: [...allMissingIds] } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(suppliers.map((s) => [s.id, s.name]));
    for (const t of allTerms) {
      t.missingSuppliers = t.missingSuppliers.map((s) => ({
        id: s.id,
        name: nameMap.get(s.id) ?? s.id,
      }));
    }
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

  // Monthly breakdown
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
  ];
  const monthly: MonthlyData[] = monthLabels.map((month) => ({
    month,
    sales: 0,
    expenses: 0,
  }));
  for (const tx of allTransactions) {
    const m = new Date(tx.date).getMonth();
    if (tx.type === "SALE") monthly[m].sales += tx.amountNOK;
    else monthly[m].expenses += tx.amountNOK;
  }

  return {
    allTerms,
    yearToDate,
    currentTerm,
    recentTransactions,
    monthly,
  } as DashboardData;
});
