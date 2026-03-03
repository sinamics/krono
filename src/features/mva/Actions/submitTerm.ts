"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

type SubmitTermInput = {
  year: number;
  term: number;
};

export const submitTerm = withAuth(async (auth, input: SubmitTermInput) => {
  const { year, term } = input;

  const existing = await db.mvaTerm.findUnique({
    where: {
      userId_year_term: {
        userId: auth.userId,
        year,
        term,
      },
    },
  });

  if (!existing) {
    throw new Error("MVA-termin finnes ikke. Beregn terminen først.");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Denne terminen er allerede levert.");
  }

  const updated = await db.mvaTerm.update({
    where: { id: existing.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return updated;
});
