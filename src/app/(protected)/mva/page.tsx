import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getTermFromDate } from "@/lib/format";
import { db } from "@/lib/db";
import { calculateTerm } from "@/features/mva/Actions/calculateTerm";
import { TermSelector } from "@/features/mva/Components/TermSelector";
import { MvaMeldingPreview } from "@/features/mva/Components/MvaMeldingPreview";
import { MvaTermOverview } from "@/features/mva/Components/MvaTermOverview";

type PageProps = {
  searchParams: Promise<{ year?: string; term?: string }>;
};

export default async function MvaPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const term = params.term ? parseInt(params.term) : getTermFromDate(now);

  const result = await calculateTerm({ year, term });

  const allTerms = await db.mvaTerm.findMany({
    where: { userId: session.userId, year },
    orderBy: { term: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MVA-melding</h1>
        <p className="text-muted-foreground">
          Beregn og lever MVA-meldinger
        </p>
      </div>

      <TermSelector currentYear={year} currentTerm={term} />

      <MvaTermOverview terms={allTerms} />

      <MvaMeldingPreview
        termData={result.mvaTerm}
        transactions={result.transactions}
      />
    </div>
  );
}
