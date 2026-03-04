"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { logAudit } from "@/lib/audit";
import { isTermLocked } from "@/lib/term-lock";

export const deleteTransaction = withAuth(async (auth, id: string) => {
  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.userId) {
    throw new Error("Transaksjon ikke funnet.");
  }

  if (await isTermLocked(auth.userId, existing.termPeriod)) {
    throw new Error("Denne terminen er levert. Transaksjonen kan ikke slettes.");
  }

  await db.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    transactionId: id,
    userId: auth.userId,
    action: "DELETE",
    changes: { deletedAt: { from: null, to: new Date() } },
  });

  return { success: true };
});
