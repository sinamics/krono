import { db } from "@/lib/db";
import { formatTermLabel } from "@/lib/format";

export type ReportType = "monthly" | "term" | "annual";

export type MonthlyRow = {
  month: number;
  label: string;
  sales: number;
  expenses: number;
  netMva: number;
};

export type TermRow = {
  term: number;
  label: string;
  kode52: number;
  kode86: number;
  kode1: number;
  totalMva: number;
  status: string;
};

export type AnnualSummary = {
  totalSales: number;
  totalForeignPurchases: number;
  totalNorwegianPurchases: number;
  totalMvaReturned: number;
};

export type ReportData = {
  monthly: MonthlyRow[];
  terms: TermRow[];
  annual: AnnualSummary;
  totalEkomCost: number;
};

const MONTH_LABELS = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

export async function generateReport(
  userId: string,
  year: number
): Promise<ReportData> {
  const [transactions, mvaTerms] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
        deletedAt: null,
      },
    }),
    db.mvaTerm.findMany({
      where: { userId, year },
      orderBy: { term: "asc" },
    }),
  ]);

  // Monthly breakdown
  const monthly: MonthlyRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_LABELS[i],
    sales: 0,
    expenses: 0,
    netMva: 0,
  }));

  for (const tx of transactions) {
    const month = new Date(tx.date).getMonth();
    if (tx.type === "SALE") {
      monthly[month].sales += tx.amountNOK;
    } else {
      monthly[month].expenses += tx.amountNOK;
    }
  }

  for (const row of monthly) {
    row.netMva = row.sales - row.expenses;
  }

  // Term breakdown
  const terms: TermRow[] = Array.from({ length: 6 }, (_, i) => {
    const term = i + 1;
    const mvaTerm = mvaTerms.find((t) => t.term === term);
    return {
      term,
      label: formatTermLabel(term),
      kode52: mvaTerm?.kode52Grunnlag ?? 0,
      kode86: mvaTerm?.kode86Grunnlag ?? 0,
      kode1: mvaTerm?.kode1MvaFradrag ?? 0,
      totalMva: mvaTerm?.totalMva ?? 0,
      status: mvaTerm?.status ?? "DRAFT",
    };
  });

  // Annual summary
  let totalSales = 0;
  let totalForeignPurchases = 0;
  let totalNorwegianPurchases = 0;

  for (const tx of transactions) {
    if (tx.type === "SALE") {
      totalSales += tx.amountNOK;
    } else if (tx.mvaCode === "CODE_86") {
      totalForeignPurchases += tx.amountNOK;
    } else {
      totalNorwegianPurchases += tx.amountNOK;
    }
  }

  const totalMvaReturned = mvaTerms.reduce((sum, t) => sum + t.totalMva, 0);

  // EKOM costs — sum transactions with EKOM-related categories
  const ekomCategories = ["ekom", "internet", "internett", "telefon", "mobil", "bredbånd", "bredband"];
  let totalEkomCost = 0;
  for (const tx of transactions) {
    if (
      tx.type === "EXPENSE" &&
      tx.category &&
      ekomCategories.includes(tx.category.toLowerCase())
    ) {
      totalEkomCost += tx.amountNOK;
    }
  }

  return {
    monthly,
    terms,
    annual: {
      totalSales,
      totalForeignPurchases,
      totalNorwegianPurchases,
      totalMvaReturned,
    },
    totalEkomCost,
  };
}
