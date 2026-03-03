import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { getTransactionById } from "@/features/transactions/Actions/getTransactions";
import { TransactionForm } from "@/features/transactions/Components/TransactionForm";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const transaction = await getTransactionById(id, session.userId);
  if (!transaction) notFound();

  const suppliers = await db.supplier.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Rediger transaksjon</h1>
      </div>
      <TransactionForm suppliers={suppliers} transaction={transaction} />
    </div>
  );
}
