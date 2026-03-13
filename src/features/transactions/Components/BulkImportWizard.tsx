"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ScanSearch,
  TableIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BulkFileDropzone } from "./BulkFileDropzone";
import { BulkReviewTable, type ReviewRow } from "./BulkReviewTable";
import { bulkCreateTransactions } from "../Actions/bulkCreateTransactions";
import { getExchangeRate } from "../Actions/getExchangeRate";
import { checkDuplicate } from "../Actions/checkDuplicate";
import type { ParsedReceipt } from "./ReceiptUpload";

type Supplier = {
  id: string;
  name: string;
};

type Step = "upload" | "scanning" | "review" | "importing" | "done";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "scanning" | "done" | "error";
  error?: string;
  receiptUrl?: string;
  parsed?: ParsedReceipt;
};

type Props = {
  suppliers: Supplier[];
};

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Last opp", icon: <Upload className="h-4 w-4" /> },
  { key: "scanning", label: "Skanner", icon: <ScanSearch className="h-4 w-4" /> },
  { key: "review", label: "Gjennomgå", icon: <TableIcon className="h-4 w-4" /> },
  { key: "done", label: "Ferdig", icon: <CheckCircle2 className="h-4 w-4" /> },
];

export function BulkImportWizard({ suppliers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const updateFileStatus = (index: number, update: Partial<FileStatus>) => {
    setFileStatuses((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...update } : s))
    );
  };

  const uploadAndParse = useCallback(
    async (file: File, index: number) => {
      // Upload
      updateFileStatus(index, { status: "uploading" });
      const formData = new FormData();
      formData.append("file", file);

      let url: string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Opplasting feilet");
        const data = await res.json();
        url = data.url;
        updateFileStatus(index, { status: "scanning", receiptUrl: url });
      } catch {
        updateFileStatus(index, { status: "error", error: "Opplasting feilet" });
        return null;
      }

      // Parse
      try {
        const res = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        });
        if (!res.ok) throw new Error("Skanning feilet");
        const parsed: ParsedReceipt = await res.json();
        updateFileStatus(index, { status: "done", parsed });
        return { url, parsed, fileName: file.name };
      } catch {
        updateFileStatus(index, { status: "error", error: "AI-skanning feilet" });
        return null;
      }
    },
    []
  );

  const startScanning = async () => {
    const statuses: FileStatus[] = files.map((f) => ({
      name: f.name,
      status: "pending" as const,
    }));
    setFileStatuses(statuses);
    setStep("scanning");

    const results: Array<{
      url: string;
      parsed: ParsedReceipt;
      fileName: string;
    } | null> = new Array(files.length).fill(null);

    // Process with concurrency of 2
    let nextIndex = 0;
    const processNext = async (): Promise<void> => {
      while (nextIndex < files.length) {
        const i = nextIndex++;
        results[i] = await uploadAndParse(files[i], i);
      }
    };

    await Promise.all([processNext(), processNext()]);

    // Build review rows from successful parses
    const reviewRows: ReviewRow[] = [];
    for (const result of results) {
      if (!result) continue;
      const { parsed, url, fileName } = result;
      const date = parsed.date ? new Date(parsed.date + "T12:00:00") : new Date();
      const currency = parsed.currency || "NOK";

      // Match supplier by name
      let supplierId: string | undefined;
      if (parsed.supplierName) {
        const match = suppliers.find(
          (s) => s.name.toLowerCase() === parsed.supplierName!.toLowerCase()
        );
        if (match) supplierId = match.id;
      }

      reviewRows.push({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        fileName,
        receiptUrl: url,
        description: parsed.description || "",
        amount: parsed.amount || 0,
        currency,
        exchangeRate: 1,
        date,
        type: "EXPENSE",
        supplierId,
        supplierName: parsed.supplierName,
        category: parsed.category,
        valid: !!(parsed.description && parsed.amount && parsed.amount > 0),
        excluded: false,
      });
    }

    // Fetch exchange rates for non-NOK rows (batch by currency+date)
    const rateRequests = new Map<string, { currency: string; date: Date }>();
    for (const row of reviewRows) {
      if (row.currency !== "NOK") {
        const key = `${row.currency}-${row.date instanceof Date ? row.date.toISOString().slice(0, 10) : ""}`;
        if (!rateRequests.has(key)) {
          rateRequests.set(key, { currency: row.currency, date: row.date });
        }
      }
    }

    const rates = new Map<string, number>();
    await Promise.all(
      Array.from(rateRequests.entries()).map(async ([key, { currency, date }]) => {
        const rate = await getExchangeRate(currency, date);
        if (rate) rates.set(key, rate);
      })
    );

    // Apply rates
    for (const row of reviewRows) {
      if (row.currency !== "NOK") {
        const key = `${row.currency}-${row.date instanceof Date ? row.date.toISOString().slice(0, 10) : ""}`;
        const rate = rates.get(key);
        if (rate) row.exchangeRate = rate;
      }
    }

    // Check for duplicates
    await Promise.all(
      reviewRows.map(async (row) => {
        if (!row.amount || !row.date) return;
        try {
          const result = await checkDuplicate({
            date: row.date,
            amount: row.amount,
            supplierId: row.supplierId,
          });
          if (result.duplicate) {
            row.excluded = true;
            row.duplicateDescription = result.description ?? undefined;
          }
        } catch {
          // Duplicate check is best-effort
        }
      })
    );

    setRows(reviewRows);
    setStep("review");
  };

  const includedRows = rows.filter((r) => !r.excluded);

  const handleImport = async () => {
    setStep("importing");
    setImportError(null);

    try {
      const items = includedRows.map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        currency: r.currency,
        exchangeRate: r.exchangeRate,
        type: r.type,
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        category: r.category === "none" ? undefined : r.category,
        receiptUrl: r.receiptUrl,
      }));

      const result = await bulkCreateTransactions({ items });
      setImportResult(result);
      setStep("done");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import feilet. Prøv igjen."
      );
      setStep("review");
    }
  };

  const completedCount = fileStatuses.filter((s) => s.status === "done").length;
  const errorCount = fileStatuses.filter((s) => s.status === "error").length;
  const excludedCount = rows.filter((r) => r.excluded).length;
  const duplicateCount = rows.filter((r) => r.duplicateDescription).length;
  const invalidIncluded = includedRows.filter((r) => !r.valid).length;
  const canImport = includedRows.length > 0 && invalidIncluded === 0;

  const activeStepIndex = STEPS.findIndex(
    (s) =>
      s.key === step ||
      (step === "importing" && s.key === "done")
  );

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${
                  i <= activeStepIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                s.key === step || (step === "importing" && s.key === "done")
                  ? "bg-primary text-primary-foreground"
                  : i < activeStepIndex
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.icon}
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <BulkFileDropzone files={files} onChange={setFiles} />
          <div className="flex justify-end">
            <Button onClick={startScanning} disabled={files.length === 0}>
              <ScanSearch className="mr-2 h-4 w-4" />
              Start skanning ({files.length} fil{files.length !== 1 ? "er" : ""})
            </Button>
          </div>
        </div>
      )}

      {/* Step: Scanning */}
      {step === "scanning" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>
                Skannet {completedCount + errorCount} av {fileStatuses.length}
              </span>
              {errorCount > 0 && (
                <span className="text-destructive">{errorCount} feilet</span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${((completedCount + errorCount) / fileStatuses.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            {fileStatuses.map((fs, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
              >
                {fs.status === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                {fs.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {fs.status === "scanning" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {fs.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {fs.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="flex-1 truncate">{fs.name}</span>
                {fs.status === "uploading" && (
                  <Badge variant="secondary">Laster opp...</Badge>
                )}
                {fs.status === "scanning" && (
                  <Badge variant="secondary">Skanner...</Badge>
                )}
                {fs.status === "done" && (
                  <Badge variant="outline" className="text-green-600">
                    Ferdig
                  </Badge>
                )}
                {fs.status === "error" && (
                  <Badge variant="destructive">{fs.error}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {rows.length} transaksjon{rows.length !== 1 ? "er" : ""} funnet
            </p>
            {duplicateCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                {duplicateCount} duplikat{duplicateCount !== 1 ? "er" : ""}
              </Badge>
            )}
            {excludedCount > 0 && (
              <Badge variant="secondary">
                {excludedCount} ekskludert
              </Badge>
            )}
            {invalidIncluded > 0 && (
              <Badge variant="destructive">
                {invalidIncluded} ugyldig{invalidIncluded !== 1 ? "e" : ""}
              </Badge>
            )}
          </div>
          {importError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}
          <BulkReviewTable
            rows={rows}
            suppliers={suppliers}
            onChange={setRows}
          />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setRows([]);
                setFileStatuses([]);
              }}
            >
              Start på nytt
            </Button>
            <Button onClick={handleImport} disabled={!canImport}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Importer {includedRows.length} transaksjon{includedRows.length !== 1 ? "er" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Importerer {includedRows.length} transaksjon{includedRows.length !== 1 ? "er" : ""}
            ...
          </p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
          <h2 className="text-lg font-semibold">Import fullført</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {importResult.imported} transaksjon
            {importResult.imported !== 1 ? "er" : ""} importert
          </p>
          <Button className="mt-6" onClick={() => router.push("/transactions")}>
            Gå til transaksjoner
          </Button>
        </div>
      )}
    </div>
  );
}
