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

  const reportData = await generateReport(session.userId, year);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Rapporter</h1>
      <ReportOverview reportData={reportData} year={year} />
      <EkomAdjustmentCalculator />
    </div>
  );
}
