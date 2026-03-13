import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, FileText } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { getTransactionById } from "@/features/transactions/Actions/getTransactions";
import { TransactionForm } from "@/features/transactions/Components/TransactionForm";
import { isTermLocked } from "@/lib/term-lock";
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
import { AuditLog } from "@/features/transactions/Components/AuditLog";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const transaction = await getTransactionById(id, session.userId);
  if (!transaction) notFound();

  const locked = await isTermLocked(session.userId, transaction.termPeriod);

  const suppliers = await db.supplier.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });

  // Calculate MVA amount for this transaction
  let mvaAmount = 0;
  if (transaction.mvaCode === "CODE_1") {
    // Norwegian purchase: amount includes 25% VAT → VAT = amount × 25/125
    mvaAmount = transaction.amountNOK * 0.2;
  } else if (transaction.mvaCode === "CODE_86") {
    // Foreign purchase: reverse charge 25%
    mvaAmount = transaction.amountNOK * 0.25;
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Summary + Receipt */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Oppsummering</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/transactions/${transaction.id}/utleggsskjema`}>
                      <FileText className="mr-1 size-4" />
                      Utleggsskjema
                    </Link>
                  </Button>
                </div>
                <Badge variant={transaction.type === "SALE" ? "default" : "secondary"}>
                  {transaction.type === "SALE" ? "Salg" : "Utgift"}
                </Badge>
              </div>
              <CardDescription>{transaction.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {transaction.bilagsnummer && (
                  <div>
                    <p className="text-muted-foreground">Bilagsnummer</p>
                    <p className="font-medium font-mono">{transaction.bilagsnummer}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Beløp (inkl. MVA)</p>
                  <p className="font-medium">{formatCurrency(transaction.amountNOK)}</p>
                </div>
                {mvaAmount > 0 && (
                  <div>
                    <p className="text-muted-foreground">MVA-fradrag</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(mvaAmount)}
                    </p>
                  </div>
                )}
                {mvaAmount > 0 && transaction.mvaCode === "CODE_1" && (
                  <div>
                    <p className="text-muted-foreground">Netto (eks. MVA)</p>
                    <p className="font-medium">
                      {formatCurrency(transaction.amountNOK - mvaAmount)}
                    </p>
                  </div>
                )}
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
                {transaction.supplier?.vatId && (
                  <div>
                    <p className="text-muted-foreground">VAT-ID</p>
                    <p className="font-medium">{transaction.supplier.vatId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {transaction.receiptUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kvittering</CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.receiptUrl.endsWith(".pdf") ? (
                  <iframe
                    src={transaction.receiptUrl}
                    className="h-[600px] w-full rounded border"
                    title="Kvittering"
                  />
                ) : (
                  <a
                    href={transaction.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={transaction.receiptUrl}
                      alt="Kvittering"
                      className="w-full rounded border"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Endringslogg</CardTitle>
              <CardDescription>
                Historikk over endringer på denne transaksjonen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLog transactionId={transaction.id} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Edit form */}
        <div>
          {locked ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-6">
                <Lock className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Transaksjonen er låst</p>
                  <p className="text-sm text-muted-foreground">
                    MVA-terminen er levert. Transaksjonen kan ikke endres.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
