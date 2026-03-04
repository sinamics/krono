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
    source?: string;
    page?: string;
  }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const year = params.year ?? String(new Date().getFullYear());
  const page = Math.max(1, Number(params.page) || 1);

  const termPeriod = params.term ? `${year}-${params.term}` : undefined;

  const result = await getTransactions({
    userId: session.userId,
    termPeriod,
    type: params.type,
    mvaCode: params.mvaCode,
    search: params.search,
    source: params.source,
    year: termPeriod ? undefined : year,
    page,
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
      <TransactionList
        transactions={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
