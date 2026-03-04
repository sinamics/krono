"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Pencil, Trash2, Plus } from "lucide-react";

type Props = {
  suppliers: SupplierWithCount[];
};

export function SupplierList({ suppliers }: Props) {
  const router = useRouter();
  const [editSupplier, setEditSupplier] = useState<SupplierWithCount | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteSupplier(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leverandører</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny leverandør
            </Button>
          </DialogTrigger>
          <SupplierForm onSuccess={() => setCreateOpen(false)} />
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          Ingen leverandører lagt til ennå.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Land</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valuta</TableHead>
              <TableHead>Org.nr</TableHead>
              <TableHead>VAT-ID</TableHead>
              <TableHead>Transaksjoner</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.country}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.type === "NORWEGIAN" ? "default" : "secondary"
                    }
                  >
                    {s.type === "NORWEGIAN" ? "Norsk" : "Utenlandsk"}
                  </Badge>
                </TableCell>
                <TableCell>{s.currency}</TableCell>
                <TableCell>{s.orgNr ?? "—"}</TableCell>
                <TableCell>{s.vatId ?? "—"}</TableCell>
                <TableCell>{s._count.transactions}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog
                      open={editSupplier?.id === s.id}
                      onOpenChange={(open) =>
                        setEditSupplier(open ? s : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={deleting}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
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
