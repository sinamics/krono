import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { getTransactionById } from "@/features/transactions/Actions/getTransactions";
import { TransactionForm } from "@/features/transactions/Components/TransactionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatDate,
  getMvaCodeLabel,
} from "@/lib/format";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rediger transaksjon</h1>
          <p className="text-sm text-muted-foreground">
            Opprettet {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Oppsummering</CardTitle>
            <Badge variant={transaction.type === "SALE" ? "default" : "secondary"}>
              {transaction.type === "SALE" ? "Salg" : "Utgift"}
            </Badge>
          </div>
          <CardDescription>{transaction.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Beløp</p>
              <p className="font-medium">{formatCurrency(transaction.amountNOK)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dato</p>
              <p className="font-medium">{formatDate(transaction.date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">MVA-kode</p>
              <p className="font-medium">{getMvaCodeLabel(transaction.mvaCode)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Leverandør</p>
              <p className="font-medium">
                {transaction.supplier?.name ?? "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endre transaksjon</CardTitle>
          <CardDescription>
            Oppdater feltene nedenfor og trykk lagre.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <TransactionForm suppliers={suppliers} transaction={transaction} />
        </CardContent>
      </Card>
    </div>
  );
}
