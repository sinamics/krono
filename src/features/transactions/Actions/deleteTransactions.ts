"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { logAudit } from "@/lib/audit";
import { getLockedTermPeriods } from "@/lib/term-lock";

export const deleteTransactions = withAuth(async (auth, ids: string[]) => {
  if (ids.length === 0) return { deleted: 0 };

  const lockedTerms = await getLockedTermPeriods(auth.userId);

  // Check if any selected transactions belong to locked terms
  const transactions = await db.transaction.findMany({
    where: { id: { in: ids }, userId: auth.userId },
    select: { id: true, termPeriod: true },
  });

  const lockedCount = transactions.filter((tx) => lockedTerms.has(tx.termPeriod)).length;
  if (lockedCount > 0) {
    throw new Error(
      `${lockedCount} av transaksjonene tilhører leverte terminer og kan ikke slettes.`
    );
  }

  const now = new Date();

  const result = await db.transaction.updateMany({
    where: {
      id: { in: ids },
      userId: auth.userId,
    },
    data: { deletedAt: now },
  });

  // Log audit for each transaction
  for (const id of ids) {
    await logAudit({
      transactionId: id,
      userId: auth.userId,
      action: "DELETE",
      changes: { deletedAt: { from: null, to: now } },
    });
  }

  return { deleted: result.count };
});
