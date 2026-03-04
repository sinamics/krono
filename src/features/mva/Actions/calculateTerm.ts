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
      where: { userId: auth.userId, termPeriod },
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
        userId_year_term: {
          userId: auth.userId,
          year,
          term,
        },
      },
      create: {
        userId: auth.userId,
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
