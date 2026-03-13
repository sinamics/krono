import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { getDeletedTransactions } from "@/features/transactions/Actions/getDeletedTransactions";
import { TrashList } from "@/features/transactions/Components/TrashList";
import { Button } from "@/components/ui/button";

export default async function TrashPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const transactions = await getDeletedTransactions(session.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Papirkurv</h1>
      </div>
      <TrashList transactions={transactions} />
    </div>
  );
}
