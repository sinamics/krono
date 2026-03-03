"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { getTermDeadline } from "@/lib/format";

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

    let kode52Grunnlag = 0;
    let kode86Grunnlag = 0;
    let kode1Total = 0;

    for (const tx of transactions) {
      switch (tx.mvaCode) {
        case "CODE_52":
          kode52Grunnlag += tx.amountNOK;
          break;
        case "CODE_86":
          kode86Grunnlag += tx.amountNOK;
          break;
        case "CODE_1":
          kode1Total += tx.amountNOK;
          break;
      }
    }

    const kode86Mva = kode86Grunnlag * 0.25;
    const kode86Fradrag = -kode86Mva;
    // Amounts INCLUDE VAT, so multiply by 0.2 (not 0.25)
    const kode1MvaFradrag = -(kode1Total * 0.2);
    const totalMva = kode86Mva + kode86Fradrag + kode1MvaFradrag;
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
