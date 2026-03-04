"use client";

import { useEffect, useState } from "react";
import { getAuditLog, type AuditLogEntry } from "../Actions/getAuditLog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CREATE: { label: "Opprettet", variant: "default" },
  UPDATE: { label: "Endret", variant: "secondary" },
  DELETE: { label: "Slettet", variant: "destructive" },
  RESTORE: { label: "Gjenopprettet", variant: "outline" },
};

const FIELD_LABELS: Record<string, string> = {
  date: "Dato",
  description: "Beskrivelse",
  amount: "Beløp",
  currency: "Valuta",
  exchangeRate: "Valutakurs",
  amountNOK: "Beløp (NOK)",
  type: "Type",
  mvaCode: "MVA-kode",
  supplierId: "Leverandør",
  category: "Kategori",
  receiptUrl: "Kvittering",
  isRecurring: "Gjentagende",
  recurringDay: "Gjentagelsesdag",
  notes: "Notater",
  termPeriod: "Termin",
  deletedAt: "Slettet",
};

export function AuditLog({ transactionId }: { transactionId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog(transactionId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laster endringslogg...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Ingen endringslogg.</p>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, variant: "secondary" as const };
        const changeEntries = Object.entries(log.changes).filter(
          ([key]) => key !== "deletedAt" || log.action === "DELETE"
        );

        return (
          <div key={log.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
              <div className="w-px flex-1 bg-border" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                <span className="text-muted-foreground text-xs">
                  {formatDate(log.createdAt)}
                </span>
              </div>
              {changeEntries.length > 0 && log.action !== "CREATE" && (
                <div className="mt-2 space-y-1">
                  {changeEntries.map(([field, change]) => (
                    <div key={field} className="text-xs text-muted-foreground">
                      <span className="font-medium">{FIELD_LABELS[field] ?? field}:</span>{" "}
                      <span className="line-through">{formatValue(change.from)}</span>
                      {" → "}
                      <span>{formatValue(change.to)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nei";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDate(new Date(value));
  }
  return String(value);
}
