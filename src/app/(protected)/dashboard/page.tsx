import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getDashboardData } from "@/features/dashboard/Actions/getDashboardData";
import { DashboardShell } from "@/features/dashboard/Components/DashboardShell";

type PageProps = {
  searchParams: Promise<{ year?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const year = params.year
    ? parseInt(params.year)
    : new Date().getFullYear();

  const data = await getDashboardData(year);

  return <DashboardShell data={data} year={year} />;
}
