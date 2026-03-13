import { getSession } from "@/lib/withAuth";
import { redirect } from "next/navigation";
import { getOrganizations } from "@/features/admin/Actions/adminActions";
import { OrgTable } from "@/features/admin/Components/OrgTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
};

export default async function AdminOrganizationsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const result = await getOrganizations({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
    page,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisasjoner</CardTitle>
        <CardDescription>
          Alle organisasjoner i systemet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrgTable
          organizations={result.data}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          currentOrgId={session.organizationId}
        />
      </CardContent>
    </Card>
  );
}
