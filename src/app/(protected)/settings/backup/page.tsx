"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setDownloading(true);
    setResult(null);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup feilet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? "krono-backup.zip";
      a.click();
      URL.revokeObjectURL(url);
      setResult({ type: "success", message: "Backup lastet ned." });
    } catch {
      setResult({ type: "error", message: "Kunne ikke laste ned backup." });
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setRestoring(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gjenoppretting feilet");
      }
      const data = await res.json();
      setResult({
        type: "success",
        message: `Gjenopprettet ${data.restored.suppliers} leverandører, ${data.restored.transactions} transaksjoner, ${data.restored.mvaTerms} MVA-terminer og ${data.restored.receipts} kvitteringer.`,
      });
      setSelectedFile(null);
    } catch (err) {
      setResult({
        type: "error",
        message:
          err instanceof Error ? err.message : "Gjenoppretting feilet.",
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>
            Last ned en komplett backup av alle data inkludert transaksjoner,
            leverandører, MVA-terminer, innstillinger og kvitteringer som en
            ZIP-fil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackup} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            {downloading ? "Laster ned..." : "Last ned backup"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gjenopprett</CardTitle>
          <CardDescription>
            Last opp en backup-fil for å gjenopprette alle data. Dataene
            importeres under din nåværende bruker. Eksisterende data blir ikke
            slettet — backup-data legges til.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={restoring}
            >
              <Upload className="mr-2 size-4" />
              Velg backup-fil
            </Button>
            {selectedFile && (
              <span className="text-sm text-muted-foreground">
                {selectedFile.name}
              </span>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </div>

          {selectedFile && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={restoring}>
                  {restoring ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 size-4" />
                  )}
                  {restoring ? "Gjenoppretter..." : "Gjenopprett fra backup"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bekreft gjenoppretting</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil importere alle data fra backup-filen under din
                    nåværende bruker. Eksisterende data blir ikke slettet. Er du
                    sikker?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestore}>
                    Gjenopprett
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {result && (
            <div
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                result.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
