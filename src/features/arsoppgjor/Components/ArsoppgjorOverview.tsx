"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArsoppgjorData } from "@/features/arsoppgjor/Actions/getArsoppgjorData";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Info } from "lucide-react";

function CopyableValue({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const rounded = Math.round(value);

  function handleCopy() {
    navigator.clipboard.writeText(String(Math.abs(rounded)));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono tabular-nums hover:bg-muted transition-colors cursor-copy"
          >
            {formatCurrency(value)}
            {copied ? (
              <Check className="size-3 text-green-500" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {copied
              ? "Kopiert!"
              : `Klikk for å kopiere${label ? ` (${label})` : ""}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HelpTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="inline size-3.5 text-muted-foreground ml-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type Props = {
  data: ArsoppgjorData;
  year: number;
};

export function ArsoppgjorOverview({ data, year }: Props) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [includeHjemmekontor, setIncludeHjemmekontor] = useState(false);

  const adjustedNaeringsresultat = includeHjemmekontor
    ? data.naeringsresultat
    : data.naeringsresultat + data.hjemmekontorFradrag;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Årsoppgjør {year}
          </h1>
          <p className="text-sm text-muted-foreground">
            Skattemeldingen
            {data.businessName ? ` — ${data.businessName}` : ""}
            {data.orgNr ? ` (${data.orgNr})` : ""}
          </p>
        </div>
        <Select
          value={year.toString()}
          onValueChange={(v) => router.push(`/arsoppgjor?year=${v}`)}
        >
          <SelectTrigger className="w-[100px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Næringsspesifikasjon */}
      <Card>
        <CardHeader>
          <CardTitle>N&aelig;ringsspesifikasjon</CardTitle>
          <CardDescription>
            Driftsinntekter og driftskostnader er forh&aring;ndsutfylt i skattemeldingen
            fra MVA-meldingene. Kontroller at tallene stemmer, og legg til justeringer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Forhåndsutfylt fra MVA */}
          <div>
            <p className="text-sm font-medium mb-2">Forh&aring;ndsutfylt fra MVA-meldingene</p>
            <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Sum driftsinntekter
                  <HelpTip text="Sum av grunnlaget i kode 52 (salg til utlandet) fra alle MVA-meldingene i året." />
                </span>
                <CopyableValue value={data.totalSales} label="Driftsinntekter" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Sum driftskostnader
                  <HelpTip text="Sum av grunnlaget i kode 1 og kode 86 (kjøp med fradragsrett) fra alle MVA-meldingene i året." />
                </span>
                <CopyableValue value={data.totalExpenses} label="Driftskostnader" />
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>&Aring;rsresultat</span>
                <span>{formatCurrency(data.totalSales - data.totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Manuelle justeringer */}
          <div>
            <p className="text-sm font-medium mb-2">Justeringer du m&aring; legge til manuelt</p>
            <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>
                    EKOM privatandel (tilbakef&oslash;ring)
                    <HelpTip text="Du har trukket fra 100% av telefon/internett som kostnad, men bruker det også privat. Privatandelen (maks 4 392 kr) må tilbakeføres." />
                  </span>
                  <CopyableValue value={data.ekomPrivateDeduction} label="EKOM privatandel" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Konto <span className="font-mono font-medium">7098</span> &mdash; Privat bruk av elektronisk kommunikasjon
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHjemmekontor}
                      onChange={(e) => setIncludeHjemmekontor(e.target.checked)}
                      className="rounded"
                    />
                    <span>
                      Hjemmekontor sjablong ({formatCurrency(data.hjemmekontorFradrag)})
                      <HelpTip text="Fast fradrag for bruk av hjemmekontor. Kryss av hvis du bruker et rom i boligen fast til næringsvirksomhet." />
                    </span>
                  </label>
                  {includeHjemmekontor ? (
                    <CopyableValue value={data.hjemmekontorFradrag} label="Hjemmekontor" />
                  ) : (
                    <span className="text-muted-foreground px-1.5 py-0.5">&mdash;</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Post <span className="font-mono font-medium">7700</span> &mdash; Kostnad lokaler
                </p>
              </div>
            </div>
          </div>

          {/* Forventet næringsinntekt */}
          <div className="space-y-1 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>&Aring;rsresultat</span>
              <span>{formatCurrency(data.totalSales - data.totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>+ EKOM privatandel</span>
              <span>+ {formatCurrency(data.ekomPrivateDeduction)}</span>
            </div>
            {includeHjemmekontor && (
              <div className="flex justify-between text-muted-foreground">
                <span>- Hjemmekontor sjablong</span>
                <span>- {formatCurrency(data.hjemmekontorFradrag)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>
                N&aelig;ringsinntekt = Personinntekt
                <HelpTip text="Beløpet du bør se under «Næringsinntekt» i skattemeldingen etter justeringene. For ENK er personinntekt lik næringsresultat." />
              </span>
              <CopyableValue value={adjustedNaeringsresultat} label="Næringsinntekt" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EKOM detaljer */}
      <Card>
        <CardHeader>
          <CardTitle>EKOM-detaljer</CardTitle>
          <CardDescription>
            Beregning av privatandel for telefon og internett
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dine EKOM-utgifter i {year}</span>
              <span>{formatCurrency(data.ekomTotalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maks privatandel (sjablong)</span>
              <span>{formatCurrency(4392)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Privatandel (laveste av de to)</span>
              <span>{formatCurrency(data.ekomPrivateDeduction)}</span>
            </div>
            <div className="flex justify-between font-medium text-destructive">
              <span>MVA tilbakebetaling (20%)</span>
              <span>{formatCurrency(data.ekomMvaAdjustment)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kostnadsoversikt */}
      {data.expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kostnadsoversikt</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Antall</TableHead>
                  <TableHead className="text-right">Beløp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expensesByCategory.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell>{cat.category}</TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium">Totalt</TableCell>
                  <TableCell className="text-right font-medium">
                    {data.expensesByCategory.reduce(
                      (sum, c) => sum + c.count,
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(data.totalExpenses)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MVA årsoversikt */}
      <Card>
        <CardHeader>
          <CardTitle>MVA årsoversikt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.mvaTerms.map((t) => (
              <div
                key={t.term}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">Termin {t.term}</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(t.totalMva)}
                  </span>
                  <Badge
                    variant={
                      t.status === "SUBMITTED" ? "default" : "secondary"
                    }
                  >
                    {t.status === "SUBMITTED" ? "Sendt" : "Utkast"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between rounded-lg bg-muted p-3 text-sm font-medium">
            <span>MVA totalt {year}</span>
            <span>{formatCurrency(data.mvaTotalYear)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
