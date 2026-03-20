"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { SupplierWithCount } from "../Actions/getSuppliers";
import { deleteSupplier } from "../Actions/deleteSupplier";
import { SupplierForm } from "./SupplierForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Props = {
  suppliers: SupplierWithCount[];
};

export function SupplierList({ suppliers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editSupplier, setEditSupplier] = useState<SupplierWithCount | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState(searchParams.get("search") ?? "");

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteSupplier(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  const columns = useMemo<ColumnDef<SupplierWithCount>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Navn",
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "country",
        header: "Land",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.country}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const isNorwegian = row.original.type === "NORWEGIAN";
          return (
            <Badge
              variant="outline"
              className={
                isNorwegian
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                  : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30"
              }
            >
              {isNorwegian ? "Norsk" : "Utenlandsk"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "currency",
        header: "Valuta",
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.currency}
          </span>
        ),
      },
      {
        id: "identifier",
        header: "Org.nr / VAT-ID",
        accessorFn: (row) => row.orgNr || row.vatId || "",
        cell: ({ row }) => {
          const value = row.original.orgNr || row.original.vatId;
          return (
            <span className="text-sm font-mono text-muted-foreground">
              {value ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "_count.transactions",
        id: "transactionCount",
        header: "Transaksjoner",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original._count.transactions}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="flex justify-end">Handlinger</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <TooltipProvider delayDuration={300}>
              <div className="flex justify-end gap-1">
                <Dialog
                  open={editSupplier?.id === s.id}
                  onOpenChange={(open) => setEditSupplier(open ? s : null)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <Pencil className="size-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Rediger</TooltipContent>
                  </Tooltip>
                  <SupplierForm
                    supplier={s}
                    onSuccess={() => setEditSupplier(null)}
                  />
                </Dialog>
                <DeleteButton
                  supplier={s}
                  deleting={deleting === s.id}
                  onConfirm={() => handleDelete(s.id)}
                />
              </div>
            </TooltipProvider>
          );
        },
      },
    ],
    [editSupplier, deleting]
  );

  const table = useReactTable({
    data: suppliers,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leverandører</h1>
          <p className="text-sm text-muted-foreground">
            Administrer leverandører og knytt dem til transaksjoner
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 size-4" />
              Ny leverandør
            </Button>
          </DialogTrigger>
          <SupplierForm onSuccess={() => setCreateOpen(false)} />
        </Dialog>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk leverandører..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-[250px] pl-8 h-8"
          />
        </div>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Ingen leverandører lagt til ennå
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Opprett din første leverandør for å komme i gang
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="size-3" />
                              ) : (
                                <ArrowUpDown className="size-3 opacity-30" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        Ingen leverandører funnet for søket.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => setEditSupplier(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground tabular-nums">
                {from}–{to} av {totalRows}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Forrige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Neste
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeleteButton({
  supplier,
  deleting,
  onConfirm,
}: {
  supplier: SupplierWithCount;
  deleting: boolean;
  onConfirm: () => void;
}) {
  const txCount = supplier._count.transactions;

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-xs" disabled={deleting}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Slett</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slett {supplier.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {txCount > 0
              ? `Denne leverandøren har ${txCount} tilknyttede transaksjoner. Transaksjonene vil bli beholdt, men koblingen til leverandøren fjernes.`
              : "Er du sikker på at du vil slette denne leverandøren? Denne handlingen kan ikke angres."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Slett
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
