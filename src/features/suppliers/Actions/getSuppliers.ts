import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";

export async function getSuppliers() {
  const session = await getSession();
  if (!session) return [];

  return db.supplier.findMany({
    where: { userId: session.userId },
    include: { _count: { select: { transactions: true } } },
    orderBy: { name: "asc" },
  });
}

export type SupplierWithCount = Awaited<
  ReturnType<typeof getSuppliers>
>[number];
