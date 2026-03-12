import { db } from "@/lib/db";
import type { Prisma, transaction, supplier } from "@/generated/db/client";

export type TransactionWithSupplier = transaction & {
  supplier: supplier | null;
};

export type PaginatedTransactions = {
  data: TransactionWithSupplier[];
  total: number;
  page: number;
  pageSize: number;
};

type TransactionFilters = {
  userId: string;
  termPeriod?: string;
  type?: string;
  mvaCode?: string;
  search?: string;
  year?: string;
  source?: string;
  supplierId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function getTransactions(filters: TransactionFilters): Promise<PaginatedTransactions> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const where: Prisma.transactionWhereInput = { userId: filters.userId, deletedAt: null };

  if (filters.termPeriod) {
    where.termPeriod = filters.termPeriod;
  }

  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type;
  }

  if (filters.mvaCode && filters.mvaCode !== "ALL") {
    where.mvaCode = filters.mvaCode;
  }

  if (filters.year) {
    where.termPeriod = { startsWith: filters.year };
  }

  if (filters.search) {
    const term = filters.search;
    const numericValue = parseFloat(term);
    const searchConditions: Prisma.transactionWhereInput[] = [
      { description: { contains: term, mode: "insensitive" } },
      { supplier: { name: { contains: term, mode: "insensitive" } } },
      { category: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
    ];

    if (!isNaN(numericValue)) {
      searchConditions.push({ amount: numericValue });
      searchConditions.push({ amountNOK: numericValue });
    }

    if (where.OR) {
      // source filter already uses OR, wrap both in AND
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  if (filters.supplierId && filters.supplierId !== "ALL") {
    where.supplierId = filters.supplierId;
  }

  if (filters.source === "manual") {
    where.externalId = null;
  } else if (filters.source === "stripe") {
    where.OR = [
      { externalId: { startsWith: "ch_" } },
      { externalId: { startsWith: "fee_" } },
    ];
  } else if (filters.source === "paypal") {
    where.OR = [
      { externalId: { startsWith: "pp_" } },
      { externalId: { startsWith: "ppfee_" } },
    ];
  }

  const sortableFields = ["date", "description", "amountNOK", "bilagsnummer", "type", "mvaCode"] as const;
  type SortableField = (typeof sortableFields)[number];
  const sortBy = sortableFields.includes(filters.sortBy as SortableField)
    ? (filters.sortBy as SortableField)
    : "date";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const [data, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { supplier: true },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getTransactionById(id: string, userId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id },
    include: { supplier: true },
  });

  if (!transaction || transaction.userId !== userId || transaction.deletedAt) {
    return null;
  }

  return transaction;
}
