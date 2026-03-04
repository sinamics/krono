"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { transactionSchema } from "../Schema/transactionSchema";
import { determineMvaCode, getTermPeriod, calculateAmountNOK } from "@/lib/tax-calculations";

export const createTransaction = withAuth(
  async (auth, formData: unknown) => {
    const data = transactionSchema.parse(formData);
    const amountNOK = calculateAmountNOK(data.amount, data.exchangeRate);
    const termPeriod = getTermPeriod(data.date);

    let supplierType = data.supplierType;
    let supplierDefaultMvaCode: string | null = null;

    if (data.supplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: data.supplierId },
      });
      if (supplier) {
        supplierType = supplier.type as "NORWEGIAN" | "FOREIGN";
        supplierDefaultMvaCode = supplier.defaultMvaCode;
      }
    }

    const mvaCode = determineMvaCode(
      data.type,
      supplierType,
      supplierDefaultMvaCode
    );

    const transaction = await db.transaction.create({
      data: {
        userId: auth.userId,
        date: data.date,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        amountNOK,
        type: data.type,
        mvaCode,
        supplierId: data.type === "EXPENSE" && data.supplierId ? data.supplierId : undefined,
        category: data.category || undefined,
        isRecurring: data.isRecurring,
        recurringDay: data.isRecurring ? data.recurringDay : undefined,
        notes: data.notes || undefined,
        receiptUrl: data.receiptUrl || undefined,
        termPeriod,
      },
    });

    return transaction;
  }
);
