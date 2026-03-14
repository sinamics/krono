import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getUsers } from "@/features/admin/Actions/getUsers";
import { UserTable } from "@/features/admin/Components/UserTable";
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
    role?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const result = await getUsers({
    search: params.search,
    role: params.role,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
    page,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brukere</CardTitle>
        <CardDescription>
          Alle registrerte brukere i systemet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserTable
          users={result.data}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          currentUserId={session.userId}
        />
      </CardContent>
    </Card>
  );
}
