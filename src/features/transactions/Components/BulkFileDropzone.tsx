"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function BulkFileDropzone({ files, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles).filter(
        (f) => f.type.startsWith("image/") || f.type === "application/pdf"
      );
      onChange([...files, ...arr]);
    },
    [files, onChange]
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">
          Dra og slipp faktura her, eller klikk for å velge
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF og bilder (PNG, JPG). Flere filer støttes.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length} fil{files.length !== 1 ? "er" : ""} valgt
          </p>
          <div className="space-y-1">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
              >
                {file.type === "application/pdf" ? (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
