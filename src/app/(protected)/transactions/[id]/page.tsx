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
  const transaction = await getTransactionById(id, session.organizationId);
  if (!transaction) notFound();

  const locked = await isTermLocked(session.organizationId, transaction.termPeriod);

  const suppliers = await db.supplier.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });

  // Resolve integration source label
  let integrationLabel: string | null = null;
  if (transaction.externalId) {
    const provider =
      transaction.externalId.startsWith("ch_") || transaction.externalId.startsWith("fee_")
        ? "stripe"
        : transaction.externalId.startsWith("pp_") || transaction.externalId.startsWith("ppfee_")
          ? "paypal"
          : null;

    if (provider) {
      const integrations = await db.integration.findMany({
        where: { organizationId: session.organizationId, provider },
        select: { name: true },
      });
      const providerName = provider === "stripe" ? "Stripe" : "PayPal";
      integrationLabel =
        integrations.length === 1
          ? `${integrations[0].name} – ${providerName}`
          : providerName;
    }
  }

  // Calculate MVA amount for this transaction
  let mvaAmount = 0;
  if (transaction.mvaCode === "CODE_1") {
    // Norwegian purchase: amount includes 25% VAT → VAT = amount × 25/125
    mvaAmount = transaction.amountNOK * 0.2;
  } else if (transaction.mvaCode === "CODE_86") {
    // Foreign purchase: reverse charge 25%
    mvaAmount = transaction.amountNOK * 0.25;
  }

  const isSale = transaction.type === "SALE";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rediger transaksjon</h1>
          <p className="text-sm text-muted-foreground">
            Opprettet {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Summary + Receipt */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Oppsummering</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/transactions/${transaction.id}/utleggsskjema`}>
                      <FileText className="mr-1.5 size-3.5" />
                      Utleggsskjema
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {integrationLabel && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                    >
                      {integrationLabel}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      isSale
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                    }
                  >
                    {isSale ? "Salg" : "Utgift"}
                  </Badge>
                </div>
              </div>
              <CardDescription>{transaction.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {transaction.bilagsnummer && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Bilagsnummer</p>
                    <p className="font-medium font-mono">{transaction.bilagsnummer}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Beløp (inkl. MVA)</p>
                  <p
                    className={`font-semibold tabular-nums ${
                      isSale
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(transaction.amountNOK)}
                  </p>
                </div>
                {mvaAmount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">MVA-fradrag</p>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(mvaAmount)}
                    </p>
                  </div>
                )}
                {mvaAmount > 0 && transaction.mvaCode === "CODE_1" && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Netto (eks. MVA)</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(transaction.amountNOK - mvaAmount)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Dato</p>
                  <p className="font-medium">{formatDate(transaction.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">MVA-kode</p>
                  <p className="font-medium">{getMvaCodeLabel(transaction.mvaCode)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Leverandør</p>
                  <p className="font-medium">
                    {transaction.supplier?.name ?? "—"}
                  </p>
                </div>
                {transaction.supplier?.vatId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">VAT-ID</p>
                    <p className="font-medium">{transaction.supplier.vatId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {transaction.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kvittering</CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.receiptUrl.endsWith(".pdf") ? (
                  <iframe
                    src={transaction.receiptUrl}
                    className="h-[600px] w-full rounded-lg border"
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
                      className="w-full rounded-lg border"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endringslogg</CardTitle>
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
              <CardContent className="flex items-center gap-3 py-8">
                <div className="shrink-0 rounded-lg bg-muted p-2.5">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
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
