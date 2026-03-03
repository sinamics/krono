"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon, Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ParsedReceipt = {
  description?: string;
  amount?: number;
  currency?: "NOK" | "EUR" | "USD";
  date?: string;
  supplierName?: string;
  category?: string;
};

type Props = {
  value?: string;
  onChange: (url: string | undefined) => void;
  onParsed?: (data: ParsedReceipt) => void;
};

export function ReceiptUpload({ value, onChange, onParsed }: Props) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseReceipt = async (imageUrl: string) => {
    if (!onParsed) return;
    setParsing(true);
    try {
      const res = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.ok) {
        const parsed = await res.json();
        onParsed(parsed);
      }
    } catch {
      // Parsing is best-effort
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Opplasting feilet");
        return;
      }

      onChange(data.url);

      if (autoScan) {
        await parseReceipt(data.url);
      }
    } catch {
      setError("Opplasting feilet");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isPdf = value?.endsWith(".pdf");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Kvittering (valgfritt)</label>
      {value ? (
        <div className="flex items-center gap-3 rounded-md border p-3">
          {isPdf ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm text-blue-600 underline dark:text-blue-400"
          >
            {value.split("/").pop()}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => parseReceipt(value)}
            disabled={parsing}
            title="Skann kvittering på nytt"
          >
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            className="hidden"
            id="receipt-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || parsing}
            className="w-full"
          >
            {parsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyserer kvittering...
              </>
            ) : uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Laster opp...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Last opp kvittering
              </>
            )}
          </Button>
        </div>
      )}
      {parsing && value && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyserer kvittering...
        </div>
      )}
      {onParsed && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoScan}
            onChange={(e) => setAutoScan(e.target.checked)}
            className="h-4 w-4 rounded border"
          />
          Automatisk skanning ved opplasting
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
