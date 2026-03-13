"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const deleteSupplier = withAuth(async (auth, id: string) => {
  const existing = await db.supplier.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  });

  if (!existing || existing.organizationId !== auth.organizationId) {
    throw new Error("Leverandør ikke funnet");
  }

  if (existing._count.transactions > 0) {
    await db.transaction.updateMany({
      where: { supplierId: id },
      data: { supplierId: null },
    });
  }

  await db.supplier.delete({ where: { id } });

  return { deleted: true, unlinkedTransactions: existing._count.transactions };
});
