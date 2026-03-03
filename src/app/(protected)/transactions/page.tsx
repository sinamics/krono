import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { getTransactions } from "@/features/transactions/Actions/getTransactions";
import { TransactionFilters } from "@/features/transactions/Components/TransactionFilters";
import { TransactionList } from "@/features/transactions/Components/TransactionList";
import { NewTransactionDialog } from "@/features/transactions/Components/NewTransactionDialog";

type Props = {
  searchParams: Promise<{
    year?: string;
    term?: string;
    type?: string;
    mvaCode?: string;
    search?: string;
  }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const year = params.year ?? String(new Date().getFullYear());

  const termPeriod = params.term ? `${year}-${params.term}` : undefined;

  const transactions = await getTransactions({
    userId: session.userId,
    termPeriod,
    type: params.type,
    mvaCode: params.mvaCode,
    search: params.search,
    year: termPeriod ? undefined : year,
  });

  const suppliers = await db.supplier.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaksjoner</h1>
        <NewTransactionDialog suppliers={suppliers} />
      </div>
      <TransactionFilters />
      <TransactionList transactions={transactions} />
    </div>
  );
}
