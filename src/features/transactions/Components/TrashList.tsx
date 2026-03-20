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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Trash2 className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Papirkurven er tom
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
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
              {transactions.map((tx) => {
                const isSale = tx.type === "SALE";
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tx.bilagsnummer ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[200px] truncate block text-sm">
                        {tx.description}
                      </span>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatCurrency(tx.amountNOK)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {tx.deletedAt ? formatDate(tx.deletedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleRestore(tx.id)}
                                disabled={isPending}
                              >
                                <RotateCcw className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gjenopprett</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setDeleteId(tx.id)}
                                disabled={isPending}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Slett permanent</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
