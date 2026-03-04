"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArsoppgjorData } from "@/features/arsoppgjor/Actions/getArsoppgjorData";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";

type Props = {
  data: ArsoppgjorData;
  year: number;
};

export function ArsoppgjorOverview({ data, year }: Props) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [includeHjemmekontor, setIncludeHjemmekontor] = useState(false);

  const hjemmekontorAmount = includeHjemmekontor
    ? data.hjemmekontorFradrag
    : 0;

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
            Tall til skattemeldingen
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

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Næringsinntekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalSales)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Næringskostnader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Næringsresultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(adjustedNaeringsresultat)}
            </p>
          </CardContent>
        </Card>
      </div>

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

      {/* Beregning */}
      <Card>
        <CardHeader>
          <CardTitle>Beregning av næringsresultat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Næringsinntekt</span>
              <span>+ {formatCurrency(data.totalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Næringskostnader</span>
              <span>- {formatCurrency(data.totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                EKOM privatandel (tilbakeføring)
              </span>
              <span>+ {formatCurrency(data.ekomPrivateDeduction)}</span>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeHjemmekontor}
                  onChange={(e) => setIncludeHjemmekontor(e.target.checked)}
                  className="rounded"
                />
                Hjemmekontor sjablong
              </label>
              <span>- {formatCurrency(hjemmekontorAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Næringsresultat</span>
              <span>= {formatCurrency(adjustedNaeringsresultat)}</span>
            </div>
          </div>

          {/* EKOM detail */}
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <p className="font-medium">EKOM-justering</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Dine EKOM-utgifter i {year}
              </span>
              <span>{formatCurrency(data.ekomTotalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Maks privatandel (sjablong)
              </span>
              <span>{formatCurrency(4392)}</span>
            </div>
            <div className="flex justify-between font-medium">
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

      {/* Personinntekt */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Personinntekt (ENK)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(adjustedNaeringsresultat)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            For enkeltpersonforetak er personinntekt lik næringsresultat
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
