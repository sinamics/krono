"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export type AuditLogEntry = {
  id: string;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: Date;
};

export const getAuditLog = withAuth(
  async (auth, transactionId: string): Promise<AuditLogEntry[]> => {
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    });

    if (!transaction || transaction.userId !== auth.userId) {
      throw new Error("Transaksjon ikke funnet.");
    }

    const logs = await db.auditLog.findMany({
      where: { transactionId },
      orderBy: { createdAt: "desc" },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      changes: JSON.parse(log.changes) as Record<string, { from: unknown; to: unknown }>,
      createdAt: log.createdAt,
    }));
  }
);
