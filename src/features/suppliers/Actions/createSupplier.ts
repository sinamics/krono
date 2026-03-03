"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import type { SupplierFormData } from "../Schema/supplierSchema";

export const createSupplier = withAuth(
  async (auth, data: SupplierFormData) => {
    const defaultMvaCode =
      data.defaultMvaCode ??
      (data.type === "NORWEGIAN" ? "CODE_1" : "CODE_86");

    const supplier = await db.supplier.create({
      data: {
        userId: auth.userId,
        name: data.name,
        country: data.country,
        currency: data.currency,
        type: data.type,
        defaultMvaCode,
        defaultCategory: data.defaultCategory,
        orgNr: data.orgNr,
      },
    });

    return supplier;
  }
);
