"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { transactionSchema } from "../Schema/transactionSchema";
import { determineMvaCode, getTermPeriod, calculateAmountNOK } from "@/lib/tax-calculations";

export const updateTransaction = withAuth(
  async (auth, id: string, formData: unknown) => {
    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      throw new Error("Transaksjon ikke funnet.");
    }

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

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        date: data.date,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        amountNOK,
        type: data.type,
        mvaCode,
        supplierId: data.type === "EXPENSE" && data.supplierId ? data.supplierId : null,
        category: data.category || null,
        isRecurring: data.isRecurring,
        recurringDay: data.isRecurring ? data.recurringDay : null,
        notes: data.notes || null,
        receiptUrl: data.receiptUrl || null,
        termPeriod,
      },
    });

    return transaction;
  }
);
