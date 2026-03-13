"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Fingerprint, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Passkey {
  id: string;
  name: string | null;
  credentialID: string;
  deviceType: string;
  createdAt: Date;
}

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingPasskey, setRenamingPasskey] = useState<Passkey | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passKeyToDelete, setPassKeyToDelete] = useState<Passkey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPasskeys = async () => {
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.data) {
        setPasskeys(result.data as Passkey[]);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    try {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) {
        setError(result.error.message || "Kunne ikke registrere passkey.");
      } else {
        fetchPasskeys();
      }
    } catch {
      setError("Kunne ikke registrere passkey.");
    }
    setRegistering(false);
  };

  const handleDelete = async () => {
    if (!passKeyToDelete) return;
    setDeletingId(passKeyToDelete.id);
    try {
      await authClient.passkey.deletePasskey({ id: passKeyToDelete.id });
      setPasskeys((prev) => prev.filter((p) => p.id !== passKeyToDelete.id));
    } catch {
      setError("Kunne ikke slette passkey.");
    }
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setPassKeyToDelete(null);
  };

  const handleRename = async () => {
    if (!renamingPasskey || !newName.trim()) return;
    setSaving(true);
    try {
      await authClient.passkey.updatePasskey({
        id: renamingPasskey.id,
        name: newName.trim(),
      });
      setPasskeys((prev) =>
        prev.map((p) =>
          p.id === renamingPasskey.id ? { ...p, name: newName.trim() } : p
        )
      );
      setRenameDialogOpen(false);
      setRenamingPasskey(null);
    } catch {
      setError("Kunne ikke gi nytt navn til passkey.");
    }
    setSaving(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Fingerprint className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Passkeys</CardTitle>
          </div>
          <CardDescription>
            Logg inn raskt og sikkert med fingeravtrykk, ansiktsgjenkjenning eller sikkerhetsnøkkel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Ingen passkeys registrert ennå.
            </p>
          ) : (
            <div className="space-y-2">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {pk.name || "Uten navn"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pk.deviceType === "singleDevice"
                        ? "Enhet-bundet"
                        : "Synkronisert"}
                      {" · "}
                      {new Date(pk.createdAt).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setRenamingPasskey(pk);
                        setNewName(pk.name || "");
                        setRenameDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={deletingId === pk.id}
                      onClick={() => {
                        setPassKeyToDelete(pk);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      {deletingId === pk.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />
          <Button onClick={handleRegister} disabled={registering}>
            {registering ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {registering ? "Registrerer…" : "Legg til passkey"}
          </Button>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gi nytt navn</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="passkey-name">Navn</Label>
            <Input
              id="passkey-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="f.eks. MacBook Touch ID"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleRename} disabled={saving || !newName.trim()}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Slett passkey?</DialogTitle>
            <DialogDescription>
              Du kan ikke logge inn med denne passkeyen etter sletting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId !== null}
            >
              {deletingId && <Loader2 className="mr-2 size-4 animate-spin" />}
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
