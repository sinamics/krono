import { db } from "@/lib/db";

/**
 * Returns a Set of submitted (locked) termPeriod strings for an organization.
 * e.g. {"2026-1", "2026-2"}
 */
export async function getLockedTermPeriods(organizationId: string): Promise<Set<string>> {
  const submitted = await db.mvaTerm.findMany({
    where: { organizationId, status: "SUBMITTED" },
    select: { year: true, term: true },
  });
  return new Set(submitted.map((t) => `${t.year}-${t.term}`));
}

/**
 * Check if a single termPeriod is locked (its MVA term is SUBMITTED).
 */
export async function isTermLocked(organizationId: string, termPeriod: string): Promise<boolean> {
  const [yearStr, termStr] = termPeriod.split("-");
  const year = parseInt(yearStr);
  const term = parseInt(termStr);
  if (isNaN(year) || isNaN(term)) return false;

  const mvaTerm = await db.mvaTerm.findUnique({
    where: { organizationId_year_term: { organizationId, year, term } },
    select: { status: true },
  });
  return mvaTerm?.status === "SUBMITTED";
}
