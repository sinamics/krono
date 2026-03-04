"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import type { SupplierFormData } from "../Schema/supplierSchema";

export const updateSupplier = withAuth(
  async (auth, id: string, data: SupplierFormData) => {
    const existing = await db.supplier.findUnique({ where: { id } });

    if (!existing || existing.userId !== auth.userId) {
      throw new Error("Leverandør ikke funnet");
    }

    const defaultMvaCode =
      data.defaultMvaCode ??
      (data.type === "NORWEGIAN" ? "CODE_1" : "CODE_86");

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: data.name,
        country: data.country,
        currency: data.currency,
        type: data.type,
        defaultMvaCode,
        defaultCategory: data.defaultCategory,
        orgNr: data.orgNr,
        vatId: data.vatId,
      },
    });

    return supplier;
  }
);
