"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Paperclip } from "lucide-react";
import type { transaction, supplier } from "@/generated/db/client";
import { formatCurrency, formatDate, getMvaCodeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteTransaction } from "../Actions/deleteTransaction";

type TransactionWithSupplier = transaction & {
  supplier: supplier | null;
};

type Props = {
  transactions: TransactionWithSupplier[];
};

export function TransactionList({ transactions }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteTransaction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Ingen transaksjoner funnet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dato</TableHead>
            <TableHead>Beskrivelse</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Beløp</TableHead>
            <TableHead>MVA-kode</TableHead>
            <TableHead>Leverandør</TableHead>
            <TableHead className="text-center">Kvittering</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{formatDate(tx.date)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {tx.description}
              </TableCell>
              <TableCell>
                <Badge variant={tx.type === "SALE" ? "default" : "secondary"}>
                  {tx.type === "SALE" ? "Salg" : "Utgift"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(tx.amountNOK)}
              </TableCell>
              <TableCell>{getMvaCodeLabel(tx.mvaCode)}</TableCell>
              <TableCell>{tx.supplier?.name ?? "-"}</TableCell>
              <TableCell className="text-center">
                {tx.receiptUrl ? (
                  <a
                    href={tx.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Se kvittering"
                  >
                    <Paperclip className="h-4 w-4 inline text-muted-foreground hover:text-foreground" />
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-xs" asChild>
                    <Link href={`/transactions/${tx.id}`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteId(tx.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett transaksjon</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne transaksjonen? Denne
              handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
