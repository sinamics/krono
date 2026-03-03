"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value?: string;
  onChange: (url: string | undefined) => void;
};

export function ReceiptUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
            disabled={uploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Laster opp..." : "Last opp kvittering"}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
