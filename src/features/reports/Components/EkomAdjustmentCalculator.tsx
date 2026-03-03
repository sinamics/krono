"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

const EKOM_SJABLONG_YEARLY = 4392;
const EKOM_SJABLONG_MONTHLY = Math.round(EKOM_SJABLONG_YEARLY / 12);

export function EkomAdjustmentCalculator() {
  const [totalEkomCost, setTotalEkomCost] = useState(0);

  const privateUseDeduction = Math.min(totalEkomCost, EKOM_SJABLONG_YEARLY);
  const mvaAdjustment = privateUseDeduction * 0.2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>EKOM-justering (årsoppgjør)</CardTitle>
        <CardDescription>
          Sjablongbeløp for privat bruk av elektronisk kommunikasjon.
          For 2025-2026: {formatCurrency(EKOM_SJABLONG_YEARLY)}/år
          ({formatCurrency(EKOM_SJABLONG_MONTHLY)}/mnd).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totalEkomCost">
            Totale EKOM-kostnader i året (inkl. MVA)
          </Label>
          <Input
            id="totalEkomCost"
            type="number"
            min={0}
            step={0.01}
            value={totalEkomCost || ""}
            onChange={(e) => setTotalEkomCost(Number(e.target.value))}
            placeholder="F.eks. 6000"
          />
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Totale EKOM-kostnader</span>
            <span>{formatCurrency(totalEkomCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sjablongbeløp</span>
            <span>{formatCurrency(EKOM_SJABLONG_YEARLY)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Privatandel (laveste av de to)</span>
            <span>{formatCurrency(privateUseDeduction)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>MVA-justering (20% av privatandel)</span>
            <span>{formatCurrency(mvaAdjustment)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Denne beregningen er informativ for årsoppgjøret.
          Privatandelen trekkes fra MVA-fradraget ved årsslutt.
        </p>
      </CardContent>
    </Card>
  );
}
