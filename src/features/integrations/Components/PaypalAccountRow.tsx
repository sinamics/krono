"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { disconnectPaypal, updatePaypalKey } from "../Actions/savePaypalKey";
import type { IntegrationItem } from "../Actions/getIntegration";

interface PaypalAccountRowProps {
  account: IntegrationItem;
}

export function PaypalAccountRow({ account }: PaypalAccountRowProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [editClientId, setEditClientId] = useState("");
  const [editSecret, setEditSecret] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, startSaveTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await disconnectPaypal({ id: account.id });
        setDeleted(true);
      } catch {
        // Feil ved sletting
      }
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    startSaveTransition(async () => {
      try {
        await updatePaypalKey({
          id: account.id,
          clientId: editClientId,
          secret: editSecret,
          name: editName,
        });
        setEditOpen(false);
        router.refresh();
      } catch (err) {
        setEditError(
          err instanceof Error ? err.message : "Kunne ikke oppdatere."
        );
      }
    });
  }

  if (deleted) return null;

  return (
    <>
      <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{account.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-mono text-xs text-muted-foreground">
              {account.maskedKey}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {account.lastSyncAt
                ? new Date(account.lastSyncAt).toLocaleString("nb-NO")
                : "Aldri synkronisert"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setEditName(account.name);
              setEditClientId("");
              setEditSecret("");
              setEditError("");
              setEditOpen(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-xs" disabled={isDeleting}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fjern PayPal-konto</AlertDialogTitle>
                <AlertDialogDescription>
                  Er du sikker pa at du vil fjerne &laquo;{account.name}&raquo;?
                  Denne handlingen kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Fjern
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger PayPal-konto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`paypal-name-${account.id}`}>Navn</Label>
              <Input
                id={`paypal-name-${account.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nåværende nøkkel: {account.maskedKey}. La feltene under stå tomme for å beholde nåværende legitimasjon.
            </p>
            <div className="space-y-2">
              <Label htmlFor={`paypal-cid-${account.id}`}>
                Client ID
                <span className="text-muted-foreground font-normal ml-1">(valgfritt)</span>
              </Label>
              <Input
                id={`paypal-cid-${account.id}`}
                value={editClientId}
                onChange={(e) => setEditClientId(e.target.value)}
                placeholder="La stå tom for å beholde"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`paypal-secret-${account.id}`}>
                Secret
                <span className="text-muted-foreground font-normal ml-1">(valgfritt)</span>
              </Label>
              <Input
                id={`paypal-secret-${account.id}`}
                type="password"
                value={editSecret}
                onChange={(e) => setEditSecret(e.target.value)}
                placeholder="La stå tom for å beholde"
              />
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Lagrer..." : "Lagre"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
