"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Paperclip, Lock, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
      className={`flex items-center gap-1 hover:text-foreground ${className ?? ""}`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
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
            className="h-4 w-4 rounded border"
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
                className="h-4 w-4 rounded border"
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
          <span className="font-mono text-muted-foreground">
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
        cell: ({ row }) => formatDate(row.original.date),
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
          <span className="max-w-[200px] truncate block">
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
        cell: ({ row }) => (
          <Badge variant={row.original.type === "SALE" ? "default" : "secondary"}>
            {row.original.type === "SALE" ? "Salg" : "Utgift"}
          </Badge>
        ),
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
        cell: ({ row }) => (
          <span className="text-right block">
            {formatCurrency(row.original.amountNOK)}
          </span>
        ),
      },
      {
        accessorKey: "mvaCode",
        header: () => (
          <SortableHeader
            label="MVA-kode"
            field="mvaCode"
            currentSort={currentSort}
            currentOrder={currentOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => getMvaCodeLabel(row.original.mvaCode),
      },
      {
        id: "supplier",
        header: "Leverandør",
        cell: ({ row }) => row.original.supplier?.name ?? "-",
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
                <Paperclip className="h-4 w-4 inline text-muted-foreground hover:text-foreground" />
              </a>
            ) : (
              "-"
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
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Ingen transaksjoner funnet.
      </div>
    );
  }

  return (
    <>
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
          <p className="flex-1 text-sm">
            {selectedCount} transaksjon{selectedCount > 1 ? "er" : ""} valgt
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Slett valgte
          </Button>
        </div>
      )}

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
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
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
          ))}
        </TableBody>
      </Table>

      <TransactionPagination page={page} pageSize={pageSize} total={total} />

      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent>
          {selectedTx && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedTx.description}</DialogTitle>
                  <Badge variant={selectedTx.type === "SALE" ? "default" : "secondary"}>
                    {selectedTx.type === "SALE" ? "Salg" : "Utgift"}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedTx.bilagsnummer && (
                  <div>
                    <p className="text-muted-foreground">Bilagsnummer</p>
                    <p className="font-medium font-mono">{selectedTx.bilagsnummer}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Beløp (NOK)</p>
                  <p className="font-medium">{formatCurrency(selectedTx.amountNOK)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dato</p>
                  <p className="font-medium">{formatDate(selectedTx.date)}</p>
                </div>
                {selectedTx.currency !== "NOK" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Originalbeløp</p>
                      <p className="font-medium">{formatCurrency(selectedTx.amount, selectedTx.currency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valutakurs</p>
                      <p className="font-medium">{selectedTx.exchangeRate}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-muted-foreground">MVA-kode</p>
                  <p className="font-medium">{getMvaCodeLabel(selectedTx.mvaCode)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leverandør</p>
                  <p className="font-medium">{selectedTx.supplier?.name ?? "-"}</p>
                </div>
                {selectedTx.supplier?.vatId && (
                  <div>
                    <p className="text-muted-foreground">VAT-ID</p>
                    <p className="font-medium">{selectedTx.supplier.vatId}</p>
                  </div>
                )}
                {selectedTx.category && (
                  <div>
                    <p className="text-muted-foreground">Kategori</p>
                    <p className="font-medium">{selectedTx.category}</p>
                  </div>
                )}
                {selectedTx.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notater</p>
                    <p className="font-medium">{selectedTx.notes}</p>
                  </div>
                )}
                {selectedTx.receiptUrl && (
                  <div>
                    <p className="text-muted-foreground">Kvittering</p>
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
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium mb-2">Endringslogg</p>
                <AuditLog transactionId={selectedTx.id} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {lockedSet.has(selectedTx.termPeriod) ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="size-3" />
                    Låst (termin levert)
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/transactions/${selectedTx.id}`}>
                      <Pencil className="mr-1 h-3 w-3" />
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
