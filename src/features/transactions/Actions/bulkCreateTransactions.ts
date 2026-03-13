"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { bulkTransactionSchema } from "../Schema/transactionSchema";
import {
  determineMvaCode,
  getTermPeriod,
  calculateAmountNOK,
} from "@/lib/tax-calculations";
import { getNextBilagsnummer } from "@/lib/bilagsnummer";
import { logAudit } from "@/lib/audit";

export const bulkCreateTransactions = withAuth(
  async (auth, formData: unknown) => {
    const { items } = bulkTransactionSchema.parse(formData);

    let nextBilagsnummer = await getNextBilagsnummer(auth.organizationId);

    // Auto-create suppliers for unmatched supplierName values
    const supplierCache = new Map<string, { id: string; type: string; defaultMvaCode: string | null }>();

    // Load existing suppliers
    const existingSuppliers = await db.supplier.findMany({
      where: { organizationId: auth.organizationId },
    });
    for (const s of existingSuppliers) {
      supplierCache.set(s.name.toLowerCase(), {
        id: s.id,
        type: s.type,
        defaultMvaCode: s.defaultMvaCode,
      });
    }

    // Collect unique supplier names that need creation
    const toCreate = new Set<string>();
    for (const item of items) {
      if (item.supplierName && !item.supplierId) {
        const key = item.supplierName.toLowerCase();
        if (!supplierCache.has(key)) {
          toCreate.add(item.supplierName);
        }
      }
    }

    // Create missing suppliers
    for (const name of toCreate) {
      const supplier = await db.supplier.create({
        data: {
          organizationId: auth.organizationId,
          name,
          type: "NORWEGIAN",
          country: "Norge",
          currency: "NOK",
        },
      });
      supplierCache.set(name.toLowerCase(), {
        id: supplier.id,
        type: supplier.type,
        defaultMvaCode: supplier.defaultMvaCode,
      });
    }

    // Prepare transaction creates
    const creates = items.map((item) => {
      const amountNOK = calculateAmountNOK(item.amount, item.exchangeRate);
      const termPeriod = getTermPeriod(item.date);

      let supplierId = item.supplierId;
      let supplierType: string | undefined;
      let supplierDefaultMvaCode: string | null = null;

      if (supplierId) {
        const cached = existingSuppliers.find((s) => s.id === supplierId);
        if (cached) {
          supplierType = cached.type;
          supplierDefaultMvaCode = cached.defaultMvaCode;
        }
      } else if (item.supplierName) {
        const cached = supplierCache.get(item.supplierName.toLowerCase());
        if (cached) {
          supplierId = cached.id;
          supplierType = cached.type;
          supplierDefaultMvaCode = cached.defaultMvaCode;
        }
      }

      const mvaCode = determineMvaCode(
        item.type,
        supplierType,
        supplierDefaultMvaCode
      );

      const bilagsnummer = nextBilagsnummer++;

      return db.transaction.create({
        data: {
          organizationId: auth.organizationId,
          date: item.date,
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          exchangeRate: item.exchangeRate,
          amountNOK,
          type: item.type,
          mvaCode,
          supplierId: item.type === "EXPENSE" && supplierId ? supplierId : undefined,
          category: item.category || undefined,
          receiptUrl: item.receiptUrl || undefined,
          termPeriod,
          bilagsnummer,
          isRecurring: false,
        },
      });
    });

    // Atomic insert
    const transactions = await db.$transaction(creates);

    // Audit logs (outside transaction — best-effort)
    await Promise.allSettled(
      transactions.map((tx) =>
        logAudit({
          transactionId: tx.id,
          userId: auth.userId,
          action: "CREATE",
          changes: {},
        })
      )
    );

    return { imported: transactions.length, errors: 0 };
  }
);
