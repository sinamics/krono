"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { formatDate, getMvaCodeLabel } from "@/lib/format";

export const exportReport = withAuth(
  async (
    auth,
    input: { year: number; termPeriod?: string }
  ): Promise<string> => {
    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      date: {
        gte: new Date(input.year, 0, 1),
        lt: new Date(input.year + 1, 0, 1),
      },
      deletedAt: null,
    };

    if (input.termPeriod) {
      where.termPeriod = input.termPeriod;
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: "asc" },
      include: { supplier: true },
    });

    const header = [
      "Bilagsnr",
      "Dato",
      "Beskrivelse",
      "Type",
      "Beløp (NOK)",
      "Valuta",
      "Originalt beløp",
      "MVA-kode",
      "Leverandør",
      "VAT-ID",
      "Kategori",
      "Termin",
    ].join(";");

    const rows = transactions.map((tx) =>
      [
        tx.bilagsnummer ?? "",
        formatDate(tx.date),
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.type === "SALE" ? "Salg" : "Utgift",
        tx.amountNOK.toFixed(2),
        tx.currency,
        tx.amount.toFixed(2),
        getMvaCodeLabel(tx.mvaCode),
        tx.supplier?.name ?? "",
        tx.supplier?.vatId ?? "",
        tx.category ?? "",
        tx.termPeriod,
      ].join(";")
    );

    return [header, ...rows].join("\n");
  }
);
