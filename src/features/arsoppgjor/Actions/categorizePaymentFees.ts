"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

export const categorizePaymentFees = withAuth(async (auth) => {
  const result = await db.transaction.updateMany({
    where: {
      organizationId: auth.organizationId,
      type: "EXPENSE",
      deletedAt: null,
      OR: [
        { description: { startsWith: "Stripe-gebyr" } },
        { description: { startsWith: "PayPal-gebyr" } },
      ],
      category: null,
    },
    data: {
      category: "Betalingsgebyr",
    },
  });

  return { updated: result.count };
});
