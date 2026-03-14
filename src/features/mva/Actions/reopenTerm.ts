"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

type ReopenTermInput = {
  year: number;
  term: number;
};

export const reopenTerm = withAuth(async (auth, input: ReopenTermInput) => {
  const { year, term } = input;

  const existing = await db.mvaTerm.findUnique({
    where: {
      organizationId_year_term: {
        organizationId: auth.organizationId,
        year,
        term,
      },
    },
  });

  if (!existing) {
    throw new Error("MVA-termin finnes ikke.");
  }

  if (existing.status !== "SUBMITTED") {
    throw new Error("Denne terminen er ikke levert.");
  }

  const updated = await db.mvaTerm.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      submittedAt: null,
    },
  });

  return updated;
});
