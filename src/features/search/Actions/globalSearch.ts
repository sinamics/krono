"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  category: "transaction" | "supplier" | "page";
  href: string;
};

export type SearchResults = {
  transactions: SearchResult[];
  suppliers: SearchResult[];
  pages: SearchResult[];
};

const STATIC_PAGES: SearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", category: "page", href: "/" },
  {
    id: "page-transactions",
    title: "Transaksjoner",
    category: "page",
    href: "/transactions",
  },
  {
    id: "page-suppliers",
    title: "Leverandorer",
    subtitle: "Administrer leverandorer",
    category: "page",
    href: "/suppliers",
  },
  {
    id: "page-mva",
    title: "MVA-melding",
    subtitle: "Merverdiavgift",
    category: "page",
    href: "/mva",
  },
  {
    id: "page-reports",
    title: "Rapporter",
    subtitle: "Resultatregnskap og balanse",
    category: "page",
    href: "/reports",
  },
  {
    id: "page-arsoppgjor",
    title: "Arsoppgjor",
    subtitle: "Arsavslutning og naeringsspesifikasjon",
    category: "page",
    href: "/arsoppgjor",
  },
  {
    id: "page-settings",
    title: "Innstillinger",
    subtitle: "Bedriftsinnstillinger",
    category: "page",
    href: "/settings",
  },
];

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} ${currency}`;
}

export const globalSearch = withAuth(
  async (auth, query: string): Promise<SearchResults> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { transactions: [], suppliers: [], pages: [] };
    }

    const orgId = auth.organizationId;
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);

    const [transactions, suppliers] = await Promise.all([
      db.transaction.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          AND: words.map((word) => ({
            OR: [
              { description: { contains: word, mode: "insensitive" as const } },
              { notes: { contains: word, mode: "insensitive" as const } },
              { category: { contains: word, mode: "insensitive" as const } },
              { supplier: { name: { contains: word, mode: "insensitive" as const } } },
              { supplier: { orgNr: { contains: word, mode: "insensitive" as const } } },
              { supplier: { vatId: { contains: word, mode: "insensitive" as const } } },
              { mvaCode: { contains: word, mode: "insensitive" as const } },
              { currency: { contains: word, mode: "insensitive" as const } },
            ],
          })),
        },
        include: { supplier: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 8,
      }),
      db.supplier.findMany({
        where: {
          organizationId: orgId,
          AND: words.map((word) => ({
            OR: [
              { name: { contains: word, mode: "insensitive" as const } },
              { orgNr: { contains: word, mode: "insensitive" as const } },
              { vatId: { contains: word, mode: "insensitive" as const } },
            ],
          })),
        },
        select: { id: true, name: true, orgNr: true, country: true },
        orderBy: { name: "asc" },
        take: 5,
      }),
    ]);

    const pages = STATIC_PAGES.filter((p) =>
      words.every((word) => {
        const w = word.toLowerCase();
        return p.title.toLowerCase().includes(w) || p.subtitle?.toLowerCase().includes(w);
      })
    );

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        title: t.description,
        subtitle: [
          t.type === "SALE" ? "Inntekt" : "Utgift",
          formatAmount(t.amount, t.currency),
          t.supplier?.name,
          t.date.toLocaleDateString("nb-NO"),
        ].filter(Boolean).join(" · "),
        category: "transaction" as const,
        href: `/transactions?year=${t.date.getFullYear()}&search=${encodeURIComponent(t.description)}`,
      })),
      suppliers: suppliers.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: [s.orgNr, s.country].filter(Boolean).join(" - "),
        category: "supplier" as const,
        href: `/suppliers/${s.id}`,
      })),
      pages,
    };
  }
);
