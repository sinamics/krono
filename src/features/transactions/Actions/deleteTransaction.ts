"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const deleteTransaction = withAuth(async (auth, id: string) => {
  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.userId) {
    throw new Error("Transaksjon ikke funnet.");
  }

  await db.transaction.delete({ where: { id } });
  return { success: true };
});
