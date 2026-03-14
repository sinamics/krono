import { db } from "@/lib/db";
import { formatTermLabel } from "@/lib/format";

const HJEMMEKONTOR_SJABLONG: Record<number, number> = {
  2024: 2090,
  2025: 2192,
  2026: 2240,
};
const HJEMMEKONTOR_DEFAULT = 2240;
const EKOM_SJABLONG_YEARLY = 4392;
const EKOM_CATEGORIES = [
  "ekom",
  "internet",
  "internett",
  "telefon",
  "mobil",
  "bredbånd",
  "bredband",
];

export type ExpenseCategory = {
  category: string;
  count: number;
  total: number;
};

export type MvaTermSummary = {
  term: number;
  label: string;
  totalMva: number;
  status: string;
};

export type ArsoppgjorData = {
  totalSales: number;
  totalExpenses: number;
  expensesByCategory: ExpenseCategory[];
  ekomTotalCost: number;
  ekomPrivateDeduction: number;
  ekomMvaAdjustment: number;
  hjemmekontorFradrag: number;
  naeringsresultat: number;
  personinntekt: number;
  mvaTerms: MvaTermSummary[];
  mvaTotalYear: number;
  orgNr: string | null;
  businessName: string | null;
};

export async function getArsoppgjorData(
  organizationId: string,
  year: number
): Promise<ArsoppgjorData> {
  const [transactions, mvaTerms, settings] = await Promise.all([
    db.transaction.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
        deletedAt: null,
      },
    }),
    db.mvaTerm.findMany({
      where: { organizationId, year },
      orderBy: { term: "asc" },
    }),
    db.businessSettings.findUnique({
      where: { organizationId },
    }),
  ]);

  let totalSales = 0;
  let totalExpenses = 0;
  let ekomTotalCost = 0;
  const categoryMap = new Map<string, { count: number; total: number }>();

  for (const tx of transactions) {
    if (tx.type === "SALE") {
      totalSales += tx.amountNOK;
    } else {
      totalExpenses += tx.amountNOK;

      const cat = tx.category || "Ukategorisert";
      const entry = categoryMap.get(cat) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += tx.amountNOK;
      categoryMap.set(cat, entry);

      if (
        tx.category &&
        EKOM_CATEGORIES.includes(tx.category.toLowerCase())
      ) {
        ekomTotalCost += tx.amountNOK;
      }
    }
  }

  const expensesByCategory: ExpenseCategory[] = Array.from(
    categoryMap.entries()
  )
    .map(([category, { count, total }]) => ({ category, count, total }))
    .sort((a, b) => b.total - a.total);

  const ekomPrivateDeduction = Math.min(ekomTotalCost, EKOM_SJABLONG_YEARLY);
  const ekomMvaAdjustment = ekomPrivateDeduction * 0.2;

  const hjemmekontorFradrag = HJEMMEKONTOR_SJABLONG[year] ?? HJEMMEKONTOR_DEFAULT;

  const naeringsresultat =
    totalSales - totalExpenses + ekomPrivateDeduction - hjemmekontorFradrag;

  const mvaTermsSummary: MvaTermSummary[] = Array.from(
    { length: 6 },
    (_, i) => {
      const term = i + 1;
      const mvaTerm = mvaTerms.find((t) => t.term === term);
      return {
        term,
        label: formatTermLabel(term),
        totalMva: mvaTerm?.totalMva ?? 0,
        status: mvaTerm?.status ?? "DRAFT",
      };
    }
  );

  const mvaTotalYear = mvaTerms.reduce((sum, t) => sum + t.totalMva, 0);

  return {
    totalSales,
    totalExpenses,
    expensesByCategory,
    ekomTotalCost,
    ekomPrivateDeduction,
    ekomMvaAdjustment,
    hjemmekontorFradrag,
    naeringsresultat,
    personinntekt: naeringsresultat,
    mvaTerms: mvaTermsSummary,
    mvaTotalYear,
    orgNr: settings?.orgNr ?? null,
    businessName: settings?.businessName ?? null,
  };
}
