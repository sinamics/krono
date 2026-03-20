import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";

export async function getSupplierById(id: string) {
  const session = await getSession();
  if (!session) return null;

  return db.supplier.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { _count: { select: { transactions: true } } },
  });
}
