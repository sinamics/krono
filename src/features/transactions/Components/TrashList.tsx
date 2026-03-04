"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import type { DeletedTransaction } from "../Actions/getDeletedTransactions";
import { restoreTransaction } from "../Actions/restoreTransaction";
import { permanentlyDeleteTransaction } from "../Actions/permanentlyDeleteTransaction";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type Props = {
  transactions: DeletedTransaction[];
};

export function TrashList({ transactions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreTransaction(id);
      router.refresh();
    });
  };

  const handlePermanentDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await permanentlyDeleteTransaction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Papirkurven er tom.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bilag</TableHead>
            <TableHead>Dato</TableHead>
            <TableHead>Beskrivelse</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Beløp</TableHead>
            <TableHead>Slettet</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-muted-foreground">
                {tx.bilagsnummer ?? "—"}
              </TableCell>
              <TableCell>{formatDate(tx.date)}</TableCell>
              <TableCell>
                <span className="max-w-[200px] truncate block">
                  {tx.description}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={tx.type === "SALE" ? "default" : "secondary"}>
                  {tx.type === "SALE" ? "Salg" : "Utgift"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(tx.amountNOK)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tx.deletedAt ? formatDate(tx.deletedAt) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(tx.id)}
                    disabled={isPending}
                    title="Gjenopprett"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(tx.id)}
                    disabled={isPending}
                    title="Slett permanent"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogTitle>Slett permanent</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne transaksjonen permanent?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={isPending}
            >
              {isPending ? "Sletter..." : "Slett permanent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
