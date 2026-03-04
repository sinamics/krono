"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const deleteTransactions = withAuth(async (auth, ids: string[]) => {
  if (ids.length === 0) return { deleted: 0 };

  const result = await db.transaction.deleteMany({
    where: {
      id: { in: ids },
      userId: auth.userId,
    },
  });

  return { deleted: result.count };
});
