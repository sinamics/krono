"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { logAudit } from "@/lib/audit";

export const deleteTransactions = withAuth(async (auth, ids: string[]) => {
  if (ids.length === 0) return { deleted: 0 };

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
