import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getDashboardData } from "@/features/dashboard/Actions/getDashboardData";
import { DashboardStats } from "@/features/dashboard/Components/DashboardStats";
import { RecentTransactions } from "@/features/dashboard/Components/RecentTransactions";
import { MvaTermsOverview } from "@/features/dashboard/Components/MvaTermsOverview";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { allTerms, yearToDate, recentTransactions } =
    await getDashboardData();

  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Oversikt over din økonomi</p>
      </div>

      <DashboardStats yearToDate={yearToDate} />

      <MvaTermsOverview terms={allTerms} year={year} />

      <RecentTransactions transactions={recentTransactions} />
    </div>
  );
}
