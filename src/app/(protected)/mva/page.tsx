import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
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
  const selectedTerm = params.term ? parseInt(params.term) : null;

  const allTerms = await db.mvaTerm.findMany({
    where: { userId: session.userId, year },
    orderBy: { term: "asc" },
  });

  const result = selectedTerm
    ? await calculateTerm({ year, term: selectedTerm })
    : null;

  const displayTerms = selectedTerm
    ? allTerms.filter((t) => t.term === selectedTerm)
    : allTerms;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MVA-melding</h1>
        <p className="text-muted-foreground">
          Beregn og lever MVA-meldinger
        </p>
      </div>

      <TermSelector currentYear={year} currentTerm={selectedTerm} />

      <MvaTermOverview terms={displayTerms} />

      {result && (
        <MvaMeldingPreview
          termData={result.mvaTerm}
          transactions={result.transactions}
        />
      )}
    </div>
  );
}
