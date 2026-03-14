"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const permanentlyDeleteTransaction = withAuth(
  async (auth, id: string) => {
    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== auth.organizationId) {
      throw new Error("Transaksjon ikke funnet.");
    }

    if (!existing.deletedAt) {
      throw new Error("Transaksjonen må være i papirkurven for å slettes permanent.");
    }

    await db.transaction.delete({ where: { id } });
    return { success: true };
  }
);
