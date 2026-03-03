import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getDashboardData } from "@/features/dashboard/Actions/getDashboardData";
import { DashboardStats } from "@/features/dashboard/Components/DashboardStats";
import { RecentTransactions } from "@/features/dashboard/Components/RecentTransactions";
import { TermDeadlineCard } from "@/features/dashboard/Components/TermDeadlineCard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { stats, recentTransactions } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Oversikt over din økonomi
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} />
        <TermDeadlineCard
          nextDeadline={new Date(stats.nextDeadline)}
          termLabel={stats.currentTermLabel}
          status={stats.termStatus}
        />
      </div>
    </div>
  );
}
