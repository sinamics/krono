import { db } from "@/lib/db";
import type { transaction, supplier } from "@/generated/db/client";

export type DeletedTransaction = transaction & {
  supplier: supplier | null;
};

export async function getDeletedTransactions(
  userId: string
): Promise<DeletedTransaction[]> {
  return db.transaction.findMany({
    where: {
      userId,
      deletedAt: { not: null },
    },
    include: { supplier: true },
    orderBy: { deletedAt: "desc" },
  });
}
