"use client";

import { useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { ReportData } from "../Actions/generateReport";
import { exportReport } from "../Actions/exportReport";

type Props = {
  reportData: ReportData;
  year: number;
};

export function ReportOverview({ reportData, year }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportReport({ year });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Rapport {year}</h2>
        <Button onClick={handleExport} disabled={isPending} variant="outline">
          {isPending ? "Eksporterer..." : "Eksporter CSV"}
        </Button>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Månedlig</TabsTrigger>
          <TabsTrigger value="term">Per termin</TabsTrigger>
          <TabsTrigger value="annual">Årssammendrag</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <MonthlyTable data={reportData.monthly} />
        </TabsContent>
        <TabsContent value="term">
          <TermCards data={reportData.terms} />
        </TabsContent>
        <TabsContent value="annual">
          <AnnualSummary data={reportData.annual} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MonthlyTable({ data }: { data: ReportData["monthly"] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Måned</TableHead>
              <TableHead className="text-right">Salg</TableHead>
              <TableHead className="text-right">Utgifter</TableHead>
              <TableHead className="text-right">Netto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.sales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.expenses)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.netMva)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TermCards({ data }: { data: ReportData["terms"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((term) => (
        <Card key={term.term}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Termin {term.term} - {term.label}</CardTitle>
              <Badge variant={term.status === "SUBMITTED" ? "default" : "secondary"}>
                {term.status === "SUBMITTED" ? "Sendt" : "Utkast"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode 52</span>
              <span>{formatCurrency(term.kode52)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode 86</span>
              <span>{formatCurrency(term.kode86)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode 1 fradrag</span>
              <span>{formatCurrency(term.kode1)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total MVA</span>
              <span>{formatCurrency(term.totalMva)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnnualSummary({ data }: { data: ReportData["annual"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Totalt salg (Kode 52)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.totalSales)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Utenlandske kjøp (Kode 86)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalForeignPurchases)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Norske kjøp (Kode 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalNorwegianPurchases)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total MVA tilbakebetalt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalMvaReturned)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
