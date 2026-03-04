import { db } from "@/lib/db";
import type { Prisma } from "@/generated/db/client";

type TransactionFilters = {
  userId: string;
  termPeriod?: string;
  type?: string;
  mvaCode?: string;
  search?: string;
  year?: string;
  source?: string;
};

export async function getTransactions(filters: TransactionFilters) {
  const where: Prisma.transactionWhereInput = { userId: filters.userId };

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
    where.description = { contains: filters.search };
  }

  if (filters.source === "manual") {
    where.externalId = null;
  } else if (filters.source === "stripe") {
    where.externalId = { not: null };
  }

  return db.transaction.findMany({
    where,
    include: { supplier: true },
    orderBy: { date: "desc" },
  });
}

export async function getTransactionById(id: string, userId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id },
    include: { supplier: true },
  });

  if (!transaction || transaction.userId !== userId) {
    return null;
  }

  return transaction;
}
