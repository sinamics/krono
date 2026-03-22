"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Clock, Pencil, RefreshCw } from "lucide-react";
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
import { disconnectStripe, updateStripeKey } from "../Actions/saveStripeKey";
import { syncStripeTransactions } from "../Actions/syncStripeTransactions";
import { SyncForm } from "./SyncForm";
import type { IntegrationItem } from "../Actions/getIntegration";
import type { SyncParamsFormData } from "../Schema/integrationSchema";

interface StripeAccountRowProps {
  account: IntegrationItem;
}

export function StripeAccountRow({ account }: StripeAccountRowProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [editApiKey, setEditApiKey] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, startSaveTransition] = useTransition();
  const [syncOpen, setSyncOpen] = useState(false);

  async function handleSync(data: SyncParamsFormData) {
    const result = await syncStripeTransactions(data);
    router.refresh();
    return result;
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await disconnectStripe({ id: account.id });
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
        await updateStripeKey({
          id: account.id,
          apiKey: editApiKey,
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
            onClick={() => setSyncOpen(!syncOpen)}
            title="Synkroniser"
          >
            <RefreshCw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setEditName(account.name);
              setEditApiKey("");
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
                <AlertDialogTitle>Fjern Stripe-konto</AlertDialogTitle>
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

      {syncOpen && (
        <div className="py-3 px-1 border-b">
          <SyncForm integrationId={account.id} onSync={handleSync} />
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Stripe-konto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`stripe-name-${account.id}`}>Navn</Label>
              <Input
                id={`stripe-name-${account.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`stripe-key-${account.id}`}>
                API-nøkkel
                <span className="text-muted-foreground font-normal ml-1">(valgfritt)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Nåværende: {account.maskedKey}
              </p>
              <Input
                id={`stripe-key-${account.id}`}
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                placeholder="La stå tom for å beholde nåværende nøkkel"
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
