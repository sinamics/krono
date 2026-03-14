"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown, Trash2 } from "lucide-react";
import type { UserWithOrg } from "../Actions/getUsers";
import { deleteUser } from "../Actions/adminActions";
import { Badge } from "@/components/ui/badge";
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

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground"
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
  users: UserWithOrg[];
  total: number;
  page: number;
  pageSize: number;
  currentUserId: string;
};

export function UserTable({ users, total, page, pageSize, currentUserId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sortBy") ?? "createdAt";
  const currentOrder = searchParams.get("sortOrder") ?? "desc";
  const [deleteTarget, setDeleteTarget] = useState<UserWithOrg | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/admin/users?${params.toString()}`);
    },
    [searchParams, currentSort, currentOrder, router]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(deleteTarget.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke slette bruker.");
      }
    });
  }

  const columns: ColumnDef<UserWithOrg>[] = [
    {
      accessorKey: "name",
      header: () => (
        <SortableHeader
          label="Navn"
          field="name"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: () => (
        <SortableHeader
          label="E-post"
          field="email"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={handleSort}
        />
      ),
    },
    {
      accessorKey: "role",
      header: () => (
        <SortableHeader
          label="Rolle"
          field="role"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.role === "super_admin" ? "default" : "secondary"}>
          {row.original.role === "super_admin" ? "Super Admin" : "Bruker"}
        </Badge>
      ),
    },
    {
      accessorKey: "organizationName",
      header: "Organisasjon",
      cell: ({ row }) => row.original.organizationName ?? "-",
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <SortableHeader
          label="Registrert"
          field="createdAt"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("nb-NO")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        if (user.id === currentUserId) return null;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(user)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
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
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                Ingen brukere funnet.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Viser {from}–{to} av {total} brukere
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              Forrige
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              Neste
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bruker?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) vil bli permanent slettet.
              Organisasjoner der brukeren er eneste medlem slettes også med all data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Sletter…" : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
