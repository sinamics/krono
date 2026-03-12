import { redirect } from "next/navigation";
import Link from "next/link";
import { Trash2, FileUp } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { getTransactions } from "@/features/transactions/Actions/getTransactions";
import { TransactionFilters } from "@/features/transactions/Components/TransactionFilters";
import { TransactionList } from "@/features/transactions/Components/TransactionList";
import { NewTransactionDialog } from "@/features/transactions/Components/NewTransactionDialog";
import { getLockedTermPeriods } from "@/lib/term-lock";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{
    year?: string;
    term?: string;
    type?: string;
    mvaCode?: string;
    search?: string;
    source?: string;
    supplierId?: string;
    sortBy?: string;
    sortOrder?: string;
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
    supplierId: params.supplierId,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
    year: termPeriod ? undefined : year,
    page,
  });

  const [suppliers, lockedTermPeriods] = await Promise.all([
    db.supplier.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
    }),
    getLockedTermPeriods(session.userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaksjoner</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions/import">
              <FileUp className="mr-1 h-4 w-4" />
              Importer faktura
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions/trash">
              <Trash2 className="mr-1 h-4 w-4" />
              Papirkurv
            </Link>
          </Button>
          <NewTransactionDialog suppliers={suppliers} />
        </div>
      </div>
      <TransactionFilters suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))} />
      <TransactionList
        transactions={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        lockedTermPeriods={[...lockedTermPeriods]}
      />
    </div>
  );
}
