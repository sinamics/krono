import { db } from "@/lib/db";

export async function getNextBilagsnummer(userId: string): Promise<number> {
  const result = await db.transaction.aggregate({
    where: { userId },
    _max: { bilagsnummer: true },
  });

  return (result._max.bilagsnummer ?? 0) + 1;
}
