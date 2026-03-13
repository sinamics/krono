import { db } from "@/lib/db";

export async function getNextBilagsnummer(organizationId: string): Promise<number> {
  const result = await db.transaction.aggregate({
    where: { organizationId },
    _max: { bilagsnummer: true },
  });

  return (result._max.bilagsnummer ?? 0) + 1;
}
