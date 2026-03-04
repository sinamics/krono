"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const checkDuplicate = withAuth(
  async (
    auth,
    params: { date: Date; amount: number; supplierId?: string }
  ) => {
    const date = new Date(params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await db.transaction.findFirst({
      where: {
        userId: auth.userId,
        date: { gte: startOfDay, lte: endOfDay },
        amount: params.amount,
        ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      },
      select: { id: true, description: true },
    });

    return existing ? { duplicate: true, description: existing.description } : { duplicate: false };
  }
);
