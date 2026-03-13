import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { calculateTerm } from "@/features/mva/Actions/calculateTerm";
import { TermSelector } from "@/features/mva/Components/TermSelector";
import { MvaMeldingPreview } from "@/features/mva/Components/MvaMeldingPreview";
import { MvaTermOverview } from "@/features/mva/Components/MvaTermOverview";
import { MissingSuppliers } from "@/features/mva/Components/MissingSuppliers";

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
    where: { organizationId: session.organizationId, year },
    orderBy: { term: "asc" },
  });

  const result = selectedTerm
    ? await calculateTerm({ year, term: selectedTerm })
    : null;

  const displayTerms = selectedTerm
    ? allTerms.filter((t) => t.term === selectedTerm)
    : allTerms;

  // Compute missing suppliers when viewing a specific term (2–6)
  let missingSuppliers: { id: string; name: string }[] = [];
  if (selectedTerm && selectedTerm > 1) {
    const prevTermPeriod = `${year}-${selectedTerm - 1}`;
    const currTermPeriod = `${year}-${selectedTerm}`;

    const [prevTxs, currTxs] = await Promise.all([
      db.transaction.findMany({
        where: {
          organizationId: session.organizationId,
          termPeriod: prevTermPeriod,
          deletedAt: null,
          supplierId: { not: null },
        },
        select: { supplierId: true },
        distinct: ["supplierId"],
      }),
      db.transaction.findMany({
        where: {
          organizationId: session.organizationId,
          termPeriod: currTermPeriod,
          deletedAt: null,
          supplierId: { not: null },
        },
        select: { supplierId: true },
        distinct: ["supplierId"],
      }),
    ]);

    const currSupplierIds = new Set(currTxs.map((tx) => tx.supplierId!));
    const missingIds = prevTxs
      .map((tx) => tx.supplierId!)
      .filter((id) => !currSupplierIds.has(id));

    if (missingIds.length > 0) {
      const suppliers = await db.supplier.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true },
      });
      missingSuppliers = suppliers;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MVA-melding</h1>
        <p className="text-muted-foreground">
          Beregn og lever MVA-meldinger
        </p>
      </div>

      <TermSelector currentYear={year} currentTerm={selectedTerm} />

      {missingSuppliers.length > 0 && (
        <MissingSuppliers
          suppliers={missingSuppliers}
          prevTerm={selectedTerm! - 1}
        />
      )}

      <MvaTermOverview terms={displayTerms} />

      {result && (
        <MvaMeldingPreview
          termData={result.mvaTerm}
          transactions={result.transactions}
          missingSuppliers={missingSuppliers}
        />
      )}
    </div>
  );
}
