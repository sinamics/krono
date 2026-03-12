"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, ImageIcon, AlertCircle, Copy } from "lucide-react";
import type { BulkTransactionItem } from "../Schema/transactionSchema";

type Supplier = {
  id: string;
  name: string;
};

export type ReviewRow = BulkTransactionItem & {
  id: string;
  fileName: string;
  receiptUrl?: string;
  valid: boolean;
  excluded: boolean;
  duplicateDescription?: string;
};

type Props = {
  rows: ReviewRow[];
  suppliers: Supplier[];
  onChange: (rows: ReviewRow[]) => void;
};

const CATEGORIES = [
  { value: "", label: "Ingen kategori" },
  { value: "Internet", label: "Internet (EKOM)" },
  { value: "Telefon", label: "Telefon (EKOM)" },
  { value: "Hosting", label: "Hosting/Server" },
  { value: "Abonnement", label: "Abonnement/SaaS" },
  { value: "Kontor", label: "Kontor" },
  { value: "Reise", label: "Reise" },
  { value: "Mat", label: "Mat" },
  { value: "Programvare", label: "Programvare" },
  { value: "Utstyr", label: "Utstyr" },
  { value: "Forsikring", label: "Forsikring" },
  { value: "Regnskap", label: "Regnskap" },
  { value: "Markedsføring", label: "Markedsføring" },
  { value: "Annet", label: "Annet" },
];

function validateRow(row: ReviewRow): boolean {
  return !!(
    row.description?.trim() &&
    row.amount > 0 &&
    row.date &&
    row.currency &&
    row.exchangeRate > 0
  );
}

export function BulkReviewTable({ rows, suppliers, onChange }: Props) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const updateRow = (id: string, updates: Partial<ReviewRow>) => {
    const updated = rows.map((r) => {
      if (r.id !== id) return r;
      const merged = { ...r, ...updates };
      merged.valid = validateRow(merged);
      return merged;
    });
    onChange(updated);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-10">Fil</TableHead>
            <TableHead className="min-w-[180px]">Beskrivelse</TableHead>
            <TableHead className="w-[100px]">Beløp</TableHead>
            <TableHead className="w-[80px]">Valuta</TableHead>
            <TableHead className="w-[80px]">Kurs</TableHead>
            <TableHead className="w-[120px]">Dato</TableHead>
            <TableHead className="min-w-[150px]">Leverandør</TableHead>
            <TableHead className="w-[130px]">Kategori</TableHead>
            <TableHead className="w-[90px]">Type</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={
                row.excluded
                  ? "opacity-50"
                  : !row.valid
                    ? "bg-destructive/5"
                    : undefined
              }
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={!row.excluded}
                  onChange={(e) =>
                    updateRow(row.id, { excluded: !e.target.checked })
                  }
                  className="h-4 w-4 rounded border"
                />
              </TableCell>
              <TableCell>
                <a
                  href={row.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={row.fileName}
                >
                  {row.fileName?.endsWith(".pdf") ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </a>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {editingCell === `${row.id}-desc` ? (
                    <Input
                      autoFocus
                      defaultValue={row.description}
                      onBlur={(e) => {
                        updateRow(row.id, { description: e.target.value });
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className="cursor-pointer truncate"
                      onClick={() => setEditingCell(`${row.id}-desc`)}
                    >
                      {row.description || (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3 w-3" /> Mangler
                        </span>
                      )}
                    </span>
                  )}
                  {row.duplicateDescription && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Copy className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Duplikat av &quot;{row.duplicateDescription}&quot;
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {editingCell === `${row.id}-amount` ? (
                  <Input
                    autoFocus
                    type="number"
                    step="0.01"
                    defaultValue={row.amount}
                    onBlur={(e) => {
                      updateRow(row.id, { amount: parseFloat(e.target.value) || 0 });
                      setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="h-7 w-[90px] text-sm"
                  />
                ) : (
                  <span
                    className="cursor-pointer"
                    onClick={() => setEditingCell(`${row.id}-amount`)}
                  >
                    {row.amount > 0 ? (
                      row.amount.toFixed(2)
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-3 w-3" /> 0
                      </span>
                    )}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={row.currency}
                  onValueChange={(v) =>
                    updateRow(row.id, { currency: v as "NOK" | "EUR" | "USD" })
                  }
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOK">NOK</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {editingCell === `${row.id}-rate` ? (
                  <Input
                    autoFocus
                    type="number"
                    step="0.0001"
                    defaultValue={row.exchangeRate}
                    onBlur={(e) => {
                      updateRow(row.id, {
                        exchangeRate: parseFloat(e.target.value) || 1,
                      });
                      setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="h-7 w-[70px] text-sm"
                  />
                ) : (
                  <span
                    className="cursor-pointer"
                    onClick={() => setEditingCell(`${row.id}-rate`)}
                  >
                    {row.exchangeRate.toFixed(4)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={row.date ? formatDate(row.date) : ""}
                  onChange={(e) => {
                    const d = e.target.value ? new Date(e.target.value + "T12:00:00") : undefined;
                    if (d) updateRow(row.id, { date: d });
                  }}
                  className="h-7 text-xs"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={row.supplierId || `__name__${row.supplierName || ""}`}
                  onValueChange={(v) => {
                    if (v.startsWith("__name__")) {
                      updateRow(row.id, { supplierId: undefined, supplierName: v.slice(8) });
                    } else {
                      const sup = suppliers.find((s) => s.id === v);
                      updateRow(row.id, {
                        supplierId: v,
                        supplierName: sup?.name,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Velg..." />
                  </SelectTrigger>
                  <SelectContent>
                    {row.supplierName &&
                      !suppliers.find(
                        (s) => s.name.toLowerCase() === row.supplierName?.toLowerCase()
                      ) && (
                        <SelectItem value={`__name__${row.supplierName}`}>
                          <span className="flex items-center gap-1">
                            {row.supplierName}
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              ny
                            </Badge>
                          </span>
                        </SelectItem>
                      )}
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.category || "NONE"}
                  onValueChange={(v) => updateRow(row.id, { category: v === "NONE" ? undefined : v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value || "NONE"} value={c.value || "NONE"}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={row.type}
                  onValueChange={(v) =>
                    updateRow(row.id, { type: v as "SALE" | "EXPENSE" })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Utgift</SelectItem>
                    <SelectItem value="SALE">Salg</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
