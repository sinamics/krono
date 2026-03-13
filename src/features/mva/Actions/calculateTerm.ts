"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { getTermDeadline } from "@/lib/format";
import { calculateMva } from "@/lib/tax-calculations";

type CalculateTermInput = {
  year: number;
  term: number;
};

export const calculateTerm = withAuth(
  async (auth, input: CalculateTermInput) => {
    const { year, term } = input;
    const termPeriod = `${year}-${term}`;

    const transactions = await db.transaction.findMany({
      where: { organizationId: auth.organizationId, termPeriod, deletedAt: null },
    });

    const {
      kode52Grunnlag,
      kode86Grunnlag,
      kode86Mva,
      kode86Fradrag,
      kode1MvaFradrag,
      totalMva,
    } = calculateMva(transactions);

    const deadline = getTermDeadline(year, term);

    const mvaTerm = await db.mvaTerm.upsert({
      where: {
        organizationId_year_term: {
          organizationId: auth.organizationId,
          year,
          term,
        },
      },
      create: {
        organizationId: auth.organizationId,
        year,
        term,
        kode52Grunnlag,
        kode86Grunnlag,
        kode86Mva,
        kode86Fradrag,
        kode1MvaFradrag,
        totalMva,
        deadline,
      },
      update: {
        kode52Grunnlag,
        kode86Grunnlag,
        kode86Mva,
        kode86Fradrag,
        kode1MvaFradrag,
        totalMva,
        deadline,
      },
    });

    return { mvaTerm, transactions };
  }
);
