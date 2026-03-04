"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const EKOM_SJABLONG_YEARLY = 4392;

type Props = {
  totalEkomCost: number;
  year: number;
};

export function EkomAdjustmentCalculator({ totalEkomCost, year }: Props) {
  const privateUseDeduction = Math.min(totalEkomCost, EKOM_SJABLONG_YEARLY);
  const mvaAdjustment = privateUseDeduction * 0.2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>EKOM-justering {year}</CardTitle>
        <CardDescription>
          Beregning av privat bruk av internett/telefon. Basert på utgifter
          med kategori &quot;Internet&quot; eller &quot;Telefon&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dine EKOM-utgifter i {year}</span>
            <span>{formatCurrency(totalEkomCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maks privatandel (sjablong)</span>
            <span>{formatCurrency(EKOM_SJABLONG_YEARLY)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Privatandel (laveste av de to)</span>
            <span>{formatCurrency(privateUseDeduction)}</span>
          </div>
          <div className="flex justify-between font-medium text-destructive">
            <span>MVA du betaler tilbake (20%)</span>
            <span>{formatCurrency(mvaAdjustment)}</span>
          </div>
        </div>

        {totalEkomCost === 0 && (
          <p className="text-sm text-muted-foreground">
            Ingen EKOM-utgifter funnet. Sett kategori til &quot;Internet&quot; eller
            &quot;Telefon&quot; på dine utgifter for internett/telefon.
          </p>
        )}

        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p className="font-medium">Hvordan fungerer dette?</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Du legger inn internett/telefon-fakturaer som vanlige utgifter</li>
            <li>Sett kategori til &quot;Internet&quot; eller &quot;Telefon&quot;</li>
            <li>Skattemyndighetene antar at maks {formatCurrency(EKOM_SJABLONG_YEARLY)}/år er privat bruk</li>
            <li>Ved årsoppgjør betaler du tilbake MVA på privatandelen: {formatCurrency(mvaAdjustment)}</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
