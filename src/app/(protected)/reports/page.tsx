import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { generateReport } from "@/features/reports/Actions/generateReport";
import { ReportOverview } from "@/features/reports/Components/ReportOverview";
import { EkomAdjustmentCalculator } from "@/features/reports/Components/EkomAdjustmentCalculator";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const reportData = await generateReport(session.organizationId, year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
        <p className="text-sm text-muted-foreground">
          Finansielle rapporter og oversikter
        </p>
      </div>
      <ReportOverview reportData={reportData} year={year} />
      <EkomAdjustmentCalculator totalEkomCost={reportData.totalEkomCost} year={year} />
    </div>
  );
}
