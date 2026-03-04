"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { logAudit } from "@/lib/audit";

export const restoreTransaction = withAuth(async (auth, id: string) => {
  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.userId) {
    throw new Error("Transaksjon ikke funnet.");
  }

  if (!existing.deletedAt) {
    throw new Error("Transaksjonen er ikke slettet.");
  }

  await db.transaction.update({
    where: { id },
    data: { deletedAt: null },
  });

  await logAudit({
    transactionId: id,
    userId: auth.userId,
    action: "RESTORE",
    changes: { deletedAt: { from: existing.deletedAt, to: null } },
  });

  return { success: true };
});
