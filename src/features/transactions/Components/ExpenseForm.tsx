"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { transaction, supplier } from "@/generated/db/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

type Props = {
  transaction: transaction & { supplier: supplier | null };
  businessName?: string;
  orgNr?: string;
  ownerName: string;
};

export function ExpenseForm({
  transaction: tx,
  businessName,
  orgNr,
  ownerName,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const amountDisplay =
    tx.currency !== "NOK"
      ? `${tx.currency} ${tx.amount.toFixed(2)} (ca. ${formatCurrency(tx.amountNOK)})`
      : formatCurrency(tx.amountNOK);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/transactions/${tx.id}`}>
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Utleggsskjema</h1>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 size-4" />
          Skriv ut / Lagre PDF
        </Button>
      </div>

      <div
        ref={printRef}
        className="rounded-lg border bg-card p-8 text-card-foreground print:border-none print:bg-white print:p-0 print:text-black"
      >
        <h2 className="mb-1 text-center text-2xl font-bold">Utleggsskjema</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground print:text-gray-500">
          Vedlegg til skattemelding / MVA-oppgave
        </p>

        {(businessName || orgNr) && (
          <div className="mb-6">
            {businessName && (
              <p className="text-lg font-semibold">{businessName}</p>
            )}
            {orgNr && (
              <p className="text-sm text-muted-foreground print:text-gray-500">
                Org.nr: {orgNr}
              </p>
            )}
          </div>
        )}

        <table className="mb-8 w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                Dato
              </td>
              <td className="py-3 text-right font-medium">
                {formatDate(tx.date)}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                Beskrivelse
              </td>
              <td className="py-3 text-right font-medium">{tx.description}</td>
            </tr>
            {tx.category && (
              <tr className="border-b">
                <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                  Kategori
                </td>
                <td className="py-3 text-right font-medium">{tx.category}</td>
              </tr>
            )}
            <tr className="border-b">
              <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                Formål
              </td>
              <td className="py-3 text-right font-medium">Næringsbruk</td>
            </tr>
            <tr className="border-b">
              <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                Leverandør
              </td>
              <td className="py-3 text-right font-medium">
                {tx.supplier?.name ?? "Ukjent"}
              </td>
            </tr>
            {tx.supplier?.orgNr && (
              <tr className="border-b">
                <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                  Leverandør org.nr
                </td>
                <td className="py-3 text-right font-medium">
                  {tx.supplier.orgNr}
                </td>
              </tr>
            )}
            {tx.bilagsnummer && (
              <tr className="border-b">
                <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                  Bilagsnummer
                </td>
                <td className="py-3 text-right font-mono font-medium">
                  {tx.bilagsnummer}
                </td>
              </tr>
            )}
            <tr className="border-b">
              <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                Beløp
              </td>
              <td className="py-3 text-right text-lg font-bold">
                {amountDisplay}
              </td>
            </tr>
            {tx.notes && (
              <tr className="border-b">
                <td className="py-3 font-medium text-muted-foreground print:text-gray-500">
                  Merknad
                </td>
                <td className="py-3 text-right font-medium">{tx.notes}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="mb-1 text-sm text-muted-foreground print:text-gray-500">
          Kvittering uten organisasjonsnummer. Dette utleggsskjemaet tjener som
          bilagsdokumentasjon for skatteformål.
        </p>

        <div className="mt-12 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground print:text-gray-500">
              Dato
            </p>
            <p className="mt-1 font-medium">{formatDate(new Date())}</p>
          </div>
          <div className="text-right">
            <div className="mb-1 h-px w-48 border-b border-dashed border-foreground print:border-black" />
            <p className="text-sm text-muted-foreground print:text-gray-500">
              {ownerName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
