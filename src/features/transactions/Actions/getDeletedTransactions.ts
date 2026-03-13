import { db } from "@/lib/db";
import type { transaction, supplier } from "@/generated/db/client";

export type DeletedTransaction = transaction & {
  supplier: supplier | null;
};

export async function getDeletedTransactions(
  organizationId: string
): Promise<DeletedTransaction[]> {
  return db.transaction.findMany({
    where: {
      organizationId,
      deletedAt: { not: null },
    },
    include: { supplier: true },
    orderBy: { deletedAt: "desc" },
  });
}
