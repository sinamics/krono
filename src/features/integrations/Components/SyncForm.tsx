"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { syncParamsSchema, type SyncParamsFormData } from "../Schema/integrationSchema";
import { DatePickerField } from "./DatePickerField";

type SyncResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

interface SyncFormProps {
  integrationId: string;
  onSync: (data: SyncParamsFormData) => Promise<SyncResult>;
}

export function SyncForm({ integrationId, onSync }: SyncFormProps) {
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const form = useForm<SyncParamsFormData>({
    resolver: zodResolver(syncParamsSchema),
    defaultValues: { integrationId, from: thirtyDaysAgo, to: new Date() },
  });

  function setRange(months: number) {
    const now = new Date();
    form.setValue("from", subMonths(now, months));
    form.setValue("to", now);
  }

  function setYearRange(year: "this" | "last") {
    const ref = year === "last" ? subYears(new Date(), 1) : new Date();
    form.setValue("from", startOfYear(ref));
    form.setValue("to", year === "last" ? endOfYear(ref) : new Date());
  }

  function handleSubmit(data: SyncParamsFormData) {
    setSyncError(null);
    setSyncResult(null);
    startSyncTransition(async () => {
      try {
        const res = await onSync(data);
        setSyncResult(res);
      } catch (err) {
        setSyncError(
          err instanceof Error ? err.message : "Synkronisering feilet."
        );
      }
    });
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Synkroniser transaksjoner</h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRange(2)}>
              2 mnd
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRange(3)}>
              3 mnd
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRange(6)}>
              6 mnd
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRange(12)}>
              12 mnd
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setYearRange("this")}>
              I ar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setYearRange("last")}>
              I fjor
            </Button>
          </div>
          <div className="flex gap-4">
            <DatePickerField control={form.control} name="from" label="Fra" />
            <DatePickerField control={form.control} name="to" label="Til" />
          </div>

          <Button type="submit" disabled={isSyncing}>
            {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSyncing ? "Synkroniserer..." : "Synkroniser"}
          </Button>
        </form>
      </Form>

      {syncError && <p className="mt-4 text-sm text-destructive">{syncError}</p>}

      {syncResult && (
        <div className="mt-4 flex gap-2">
          <Badge variant="default">{syncResult.imported} importert</Badge>
          <Badge variant="secondary">{syncResult.skipped} hoppet over</Badge>
          {syncResult.errors.length > 0 && (
            <Badge variant="destructive">
              {syncResult.errors.length} feil
            </Badge>
          )}
        </div>
      )}

      {syncResult && syncResult.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {syncResult.errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
