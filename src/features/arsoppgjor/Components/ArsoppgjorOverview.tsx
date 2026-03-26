"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArsoppgjorData } from "@/features/arsoppgjor/Actions/getArsoppgjorData";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Button } from "@/components/ui/button";
import { Copy, Check, Info, ChevronRight, ExternalLink, Download, Loader2 } from "lucide-react";

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

function getMvaAmount(amountNOK: number, mvaCode: string): number {
  if (mvaCode === "CODE_1") return amountNOK * 0.2;
  if (mvaCode === "CODE_86") return amountNOK * 0.25;
  return 0;
}

const EKOM_KEYS = [
  "ekom", "internet", "internett", "telefon", "mobil",
  "bredbånd", "bredband", "telekommunikasjon", "telekom/internet",
];

const STATIC_POST_MAPPING: Record<
  string,
  { post: string; felt: string; note?: string }
> = {
  Hosting: { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" },
  Abonnement: { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" },
  Kontor: { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" },
  Programvare: { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" },
  Regnskap: { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" },
  Reise: { post: "7080", felt: "Reisekostnad" },
  Forsikring: { post: "7500", felt: "Forsikringspremie" },
  Markedsføring: { post: "7330", felt: "Salgs- og reklamekostnader" },
  Utstyr: {
    post: "6995",
    felt: "Kontorrekvisita, elektronisk kommunikasjon, porto",
    note: "Gjelder utstyr under 15 000 kr. Dyrere utstyr avskrives.",
  },
  Mat: {
    post: "\u2014",
    felt: "Vanligvis ikke fradragsberettiget",
    note: "Kun representasjon med forretningsforbindelser.",
  },
  Annet: {
    post: "\u2014",
    felt: "Vurder individuelt",
    note: "Sjekk hva kostnaden gjelder og plasser i riktig post.",
  },
  Ukategorisert: {
    post: "\u2014",
    felt: "Kategoriser f\u00f8rst",
    note: "Gi disse en kategori for \u00e5 f\u00e5 riktig post.",
  },
};

function getPostMapping(category: string) {
  if (STATIC_POST_MAPPING[category]) return STATIC_POST_MAPPING[category];
  if (EKOM_KEYS.includes(category.toLowerCase())) {
    return { post: "6995", felt: "Kontorrekvisita, elektronisk kommunikasjon, porto" };
  }
  return { post: "\u2014", felt: "Ukjent kategori \u2013 kategoriser p\u00e5 nytt" };
}

function is6995(category: string) {
  return getPostMapping(category).post === "6995";
}

function SkattemeldingGuideCard({ data }: { data: ArsoppgjorData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const post6995Categories = data.expensesByCategory.filter((c) =>
    is6995(c.category)
  );
  const otherCategories = data.expensesByCategory.filter(
    (c) => !is6995(c.category)
  );
  const sorted = [...post6995Categories, ...otherCategories];

  const post6995Total = post6995Categories.reduce(
    (sum, c) => sum + c.total,
    0
  );

  let lastPost = "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hvor f&oslash;rer du hva i skattemeldingen?</CardTitle>
        <CardDescription>
          Kategoriene fra kostnadsoversikten din fordelt p&aring; riktig post i
          skattemeldingen for n&aelig;ringsdrivende (ENK).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Kategori</TableHead>
              <TableHead>Post</TableHead>
              <TableHead className="hidden sm:table-cell">
                Felt i skattemeldingen
              </TableHead>
              <TableHead className="text-right">Bel&oslash;p</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((cat) => {
              const mapping = getPostMapping(cat.category);
              const showPostDivider = mapping.post !== lastPost;
              lastPost = mapping.post;
              const isExpanded = expanded === cat.category;
              return (
                <>
                  <TableRow
                    key={cat.category}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      showPostDivider ? "border-t-2" : ""
                    }`}
                    onClick={() =>
                      setExpanded(isExpanded ? null : cat.category)
                    }
                  >
                    <TableCell className="w-8 pr-0">
                      <ChevronRight
                        className={`size-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <span>{cat.category}</span>
                      {mapping.note && <HelpTip text={mapping.note} />}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {mapping.post}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden sm:table-cell">
                      {mapping.felt}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(cat.total)}
                    </TableCell>
                  </TableRow>
                  {isExpanded &&
                    cat.transactions.map((tx) => {
                      const mva = getMvaAmount(tx.amountNOK, tx.mvaCode);
                      return (
                        <TableRow
                          key={tx.id}
                          className="bg-muted/30 text-sm group"
                        >
                          <TableCell />
                          <TableCell
                            colSpan={2}
                            className="text-muted-foreground"
                          >
                            <Link
                              href={`/transactions/${tx.id}`}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <span className="font-mono text-xs">
                                {formatDate(tx.date)}
                              </span>
                              <span className="ml-1">{tx.description}</span>
                              {tx.notes && (
                                <span className="text-xs text-muted-foreground/70">
                                  ({tx.notes})
                                </span>
                              )}
                              <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground text-xs">
                            {mva > 0 ? `MVA ${formatCurrency(mva)}` : <span className="text-amber-500">Ingen MVA</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(tx.amountNOK)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell className="font-medium">Sum post 6995</TableCell>
              <TableCell>
                <span className="font-mono text-xs">6995</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell" />
              <TableCell className="text-right font-medium tabular-nums">
                <CopyableValue value={post6995Total} label="Sum post 6995" />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function KostnadsoversiktCard({ data }: { data: ArsoppgjorData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kostnadsoversikt</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Antall</TableHead>
              <TableHead className="text-right">Bel&oslash;p</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expensesByCategory.map((cat) => (
              <>
                <TableRow
                  key={cat.category}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    setExpanded(
                      expanded === cat.category ? null : cat.category
                    )
                  }
                >
                  <TableCell className="w-8 pr-0">
                    <ChevronRight
                      className={`size-4 text-muted-foreground transition-transform ${
                        expanded === cat.category ? "rotate-90" : ""
                      }`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {cat.category}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cat.count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(cat.total)}
                  </TableCell>
                </TableRow>
                {expanded === cat.category &&
                  cat.transactions.map((tx) => {
                    const mva = getMvaAmount(tx.amountNOK, tx.mvaCode);
                    return (
                      <TableRow
                        key={tx.id}
                        className="bg-muted/30 text-sm group"
                      >
                        <TableCell />
                        <TableCell className="text-muted-foreground">
                          <Link
                            href={`/transactions/${tx.id}`}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <span className="font-mono text-xs">
                              {formatDate(tx.date)}
                            </span>
                            <span className="ml-1">{tx.description}</span>
                            {tx.notes && (
                              <span className="text-xs text-muted-foreground/70">
                                ({tx.notes})
                              </span>
                            )}
                            <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground text-xs">
                          {mva > 0 ? `MVA ${formatCurrency(mva)}` : <span className="text-amber-500">Ingen MVA</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(tx.amountNOK)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell className="font-medium">Totalt</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {data.expensesByCategory.reduce(
                  (sum, c) => sum + c.count,
                  0
                )}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(data.totalExpenses)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
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
  const [exporting, setExporting] = useState(false);

  const adjustedNaeringsresultat = includeHjemmekontor
    ? data.naeringsresultat
    : data.naeringsresultat + data.hjemmekontorFradrag;

  async function handleExportPdf() {
    setExporting(true);
    try {
      const [{ pdf }, { ArsoppgjorPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ArsoppgjorPdf"),
      ]);
      const blob = await pdf(<ArsoppgjorPdf data={data} year={year} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arsoppgjor-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Download className="size-4 mr-1.5" />
            )}
            Eksporter PDF
          </Button>
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
                <span className="tabular-nums">{formatCurrency(data.totalSales - data.totalExpenses)}</span>
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
                  Post <span className="font-mono font-medium">6998</span> &mdash; Privat bruk av elektronisk kommunikasjon
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
              <span className="tabular-nums">{formatCurrency(data.totalSales - data.totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>+ EKOM privatandel</span>
              <span className="tabular-nums">+ {formatCurrency(data.ekomPrivateDeduction)}</span>
            </div>
            {includeHjemmekontor && (
              <div className="flex justify-between text-muted-foreground">
                <span>- Hjemmekontor sjablong</span>
                <span className="tabular-nums">- {formatCurrency(data.hjemmekontorFradrag)}</span>
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
              <span className="tabular-nums">{formatCurrency(data.ekomTotalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maks privatandel (sjablong)</span>
              <span className="tabular-nums">{formatCurrency(4392)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Privatandel (laveste av de to)</span>
              <span className="tabular-nums">{formatCurrency(data.ekomPrivateDeduction)}</span>
            </div>
            <div className="flex justify-between font-medium text-destructive">
              <span>MVA tilbakebetaling (20%)</span>
              <span className="tabular-nums">{formatCurrency(data.ekomMvaAdjustment)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kostnadsoversikt */}
      {data.expensesByCategory.length > 0 && (
        <KostnadsoversiktCard data={data} />
      )}

      {/* Skattemelding-guide */}
      {data.expensesByCategory.length > 0 && (
        <SkattemeldingGuideCard data={data} />
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
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(t.totalMva)}
                  </span>
                  <Badge
                    variant={
                      t.status === "SUBMITTED" ? "outline" : "secondary"
                    }
                    className={
                      t.status === "SUBMITTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                        : undefined
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
            <span className="tabular-nums">{formatCurrency(data.mvaTotalYear)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
