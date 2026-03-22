"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Paperclip, Lock, ArrowUp, ArrowDown, ArrowUpDown, ArrowUpRight, ArrowDownRight, FileQuestion } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useRouter as useNextRouter, useSearchParams } from "next/navigation";
import type { TransactionWithSupplier } from "../Actions/getTransactions";
import { formatCurrency, formatDate, getMvaCodeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteTransaction } from "../Actions/deleteTransaction";
import { deleteTransactions } from "../Actions/deleteTransactions";
import { TransactionPagination } from "./TransactionPagination";
import { AuditLog } from "./AuditLog";

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <button
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className ?? ""}`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  );
}

type Props = {
  transactions: TransactionWithSupplier[];
  total: number;
  page: number;
  pageSize: number;
  lockedTermPeriods?: string[];
};

export function TransactionList({ transactions, total, page, pageSize, lockedTermPeriods = [] }: Props) {
  const lockedSet = useMemo(() => new Set(lockedTermPeriods), [lockedTermPeriods]);
  const router = useRouter();
  const navRouter = useNextRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sortBy") ?? "date";
  const currentOrder = searchParams.get("sortOrder") ?? "desc";

  const handleSort = useCallback(
    (field: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (currentSort === field) {
        params.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
      } else {
        params.set("sortBy", field);
        params.set("sortOrder", "desc");
      }
      params.delete("page");
      navRouter.push(`/transactions?${params.toString()}`);
    },
    [searchParams, currentSort, currentOrder, navRouter]
  );

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionWithSupplier | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedCount = Object.keys(rowSelection).length;

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteTransaction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    const ids = Object.keys(rowSelection).map(
      (idx) => transactions[parseInt(idx)].id
    );
    startTransition(async () => {
      await deleteTransactions(ids);
      setRowSelection({});
      setShowBulkDelete(false);
      router.refresh();
    });
  };

  const columns = useMemo<ColumnDef<TransactionWithSupplier>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="size-3.5 rounded border accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as { lockedSet: Set<string> };
          const isLocked = meta.lockedSet.has(row.original.termPeriod);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="size-3.5 rounded border accent-primary"
                checked={row.getIsSelected()}
                disabled={isLocked}
                onChange={row.getToggleSelectedHandler()}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "bilagsnummer",
        header: () => (
          <SortableHeader
            label="Bilag"
            field="bilagsnummer"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.bilagsnummer ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: () => (
          <SortableHeader
            label="Dato"
            field="date"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: () => (
          <SortableHeader
            label="Beskrivelse"
            field="description"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block text-sm font-medium">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: () => (
          <SortableHeader
            label="Type"
            field="type"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => {
          const isSale = row.original.type === "SALE";
          return (
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
          );
        },
      },
      {
        accessorKey: "amountNOK",
        header: () => (
          <SortableHeader
            label="Beløp"
            field="amountNOK"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const isSale = row.original.type === "SALE";
          return (
            <span
              className={`text-right block text-sm font-medium tabular-nums ${
                isSale
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isSale ? "+" : "-"}
              {formatCurrency(Math.abs(row.original.amountNOK))}
            </span>
          );
        },
      },
      {
        accessorKey: "mvaCode",
        header: () => (
          <SortableHeader
            label="MVA"
            field="mvaCode"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getMvaCodeLabel(row.original.mvaCode)}
          </span>
        ),
      },
      {
        id: "supplier",
        header: "Leverandør",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.supplier?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "source",
        header: "Kilde",
        cell: ({ row }) => {
          const integration = row.original.integration;
          if (!integration) return <span className="text-muted-foreground/40 text-sm">—</span>;
          const provider = integration.provider === "stripe" ? "Stripe" : "PayPal";
          return (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 text-xs"
            >
              {integration.name} – {provider}
            </Badge>
          );
        },
      },
      {
        id: "receipt",
        header: () => <span className="flex justify-center">Kvittering</span>,
        cell: ({ row }) => (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            {row.original.receiptUrl ? (
              <a
                href={row.original.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Se kvittering"
              >
                <Paperclip className="size-4 inline text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="flex justify-end">Handlinger</span>,
        cell: ({ row, table }) => {
          const meta = table.options.meta as { setDeleteId: (id: string) => void; lockedSet: Set<string> };
          const isLocked = meta.lockedSet.has(row.original.termPeriod);

          if (isLocked) {
            return (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <Lock className="size-3.5 text-muted-foreground" />
              </div>
            );
          }

          return (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/transactions/${row.original.id}`}>
                  <Pencil />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => meta.setDeleteId(row.original.id)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [currentSort, currentOrder, handleSort]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    meta: { setDeleteId, lockedSet },
  });

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileQuestion className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Ingen transaksjoner funnet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Prøv å endre filtrene eller opprett en ny transaksjon
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 mb-4">
          <p className="flex-1 text-sm">
            {selectedCount} transaksjon{selectedCount > 1 ? "er" : ""} valgt
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Slett valgte
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const isLocked = lockedSet.has(row.original.termPeriod);
                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className="cursor-pointer"
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        onClick={() => setSelectedTx(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => setSelectedTx(row.original)}>
                        <FileQuestion className="size-3.5 mr-2" />
                        Detaljer
                      </ContextMenuItem>
                      {!isLocked && (
                        <ContextMenuItem asChild>
                          <Link href={`/transactions/${row.original.id}`}>
                            <Pencil className="size-3.5 mr-2" />
                            Rediger
                          </Link>
                        </ContextMenuItem>
                      )}
                      {row.original.receiptUrl && (
                        <ContextMenuItem asChild>
                          <a href={row.original.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="size-3.5 mr-2" />
                            Se kvittering
                          </a>
                        </ContextMenuItem>
                      )}
                      {!isLocked && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(row.original.id)}
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Slett
                          </ContextMenuItem>
                        </>
                      )}
                      {isLocked && (
                        <ContextMenuItem disabled>
                          <Lock className="size-3.5 mr-2" />
                          Låst (termin levert)
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionPagination page={page} pageSize={pageSize} total={total} />

      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedTx && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="text-lg">{selectedTx.description}</DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      selectedTx.type === "SALE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 shrink-0"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 shrink-0"
                    }
                  >
                    {selectedTx.type === "SALE" ? "Salg" : "Utgift"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {selectedTx.bilagsnummer && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Bilagsnummer</p>
                    <p className="font-medium font-mono">{selectedTx.bilagsnummer}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Beløp (NOK)</p>
                  <p
                    className={`font-semibold tabular-nums ${
                      selectedTx.type === "SALE"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {selectedTx.type === "SALE" ? "+" : "-"}
                    {formatCurrency(Math.abs(selectedTx.amountNOK))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Dato</p>
                  <p className="font-medium">{formatDate(selectedTx.date)}</p>
                </div>
                {selectedTx.currency !== "NOK" && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Originalbeløp</p>
                      <p className="font-medium">{formatCurrency(selectedTx.amount, selectedTx.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Valutakurs</p>
                      <p className="font-medium">{selectedTx.exchangeRate}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">MVA-kode</p>
                  <p className="font-medium">{getMvaCodeLabel(selectedTx.mvaCode)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Leverandør</p>
                  <p className="font-medium">{selectedTx.supplier?.name ?? "—"}</p>
                </div>
                {selectedTx.supplier?.vatId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">VAT-ID</p>
                    <p className="font-medium">{selectedTx.supplier.vatId}</p>
                  </div>
                )}
                {selectedTx.integration && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Kilde</p>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                    >
                      {selectedTx.integration.name} – {selectedTx.integration.provider === "stripe" ? "Stripe" : "PayPal"}
                    </Badge>
                  </div>
                )}
                {selectedTx.category && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Kategori</p>
                    <p className="font-medium">{selectedTx.category}</p>
                  </div>
                )}
                {selectedTx.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Notater</p>
                    <p className="font-medium">{selectedTx.notes}</p>
                  </div>
                )}
                {selectedTx.receiptUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Kvittering</p>
                    <a
                      href={selectedTx.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Se kvittering
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Endringslogg</p>
                <AuditLog transactionId={selectedTx.id} />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {lockedSet.has(selectedTx.termPeriod) ? (
                  <Badge variant="secondary" className="gap-1.5">
                    <Lock className="size-3" />
                    Låst (termin levert)
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/transactions/${selectedTx.id}`}>
                      <Pencil className="mr-1.5 size-3.5" />
                      Rediger
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett transaksjon</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksjonen flyttes til papirkurven. Du kan gjenopprette den
              senere.
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

      <AlertDialog open={showBulkDelete} onOpenChange={() => setShowBulkDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett {selectedCount} transaksjon{selectedCount > 1 ? "er" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} valgte transaksjon{selectedCount > 1 ? "er" : ""} flyttes til papirkurven. Du kan gjenopprette dem senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              {isPending ? "Sletter..." : `Slett ${selectedCount}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
