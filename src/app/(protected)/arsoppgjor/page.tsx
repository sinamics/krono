import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getArsoppgjorData } from "@/features/arsoppgjor/Actions/getArsoppgjorData";
import { ArsoppgjorOverview } from "@/features/arsoppgjor/Components/ArsoppgjorOverview";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ArsoppgjorPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const year = params.year
    ? parseInt(params.year, 10)
    : new Date().getFullYear();

  const data = await getArsoppgjorData(session.userId, year);

  return <ArsoppgjorOverview data={data} year={year} />;
}
