"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fixExchangeRates } from "../Actions/fixExchangeRates";

type Result = {
  fixed: number;
  skipped: number;
  total: number;
  errors: string[];
};

export function FixExchangeRatesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function handleFix() {
    startTransition(async () => {
      const res = await fixExchangeRates();
      setResult(res);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Henter valutakurser fra Norges Bank for alle transaksjoner i fremmed valuta som har kurs 1.
      </p>
      <Button onClick={handleFix} disabled={isPending} variant="outline" size="sm">
        {isPending ? "Oppdaterer..." : "Oppdater valutakurser"}
      </Button>
      {result && (
        <div className="flex gap-2">
          <Badge variant="default">{result.fixed} oppdatert</Badge>
          <Badge variant="secondary">{result.skipped} hoppet over</Badge>
          {result.errors.length > 0 && (
            <Badge variant="destructive">{result.errors.length} feil</Badge>
          )}
        </div>
      )}
    </div>
  );
}
