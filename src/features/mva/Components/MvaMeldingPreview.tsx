"use client";

import { useState } from "react";
import type { mvaTerm, transaction } from "@/generated/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatTermLabel } from "@/lib/format";
import { submitTerm } from "@/features/mva/Actions/submitTerm";

type MvaMeldingPreviewProps = {
  termData: mvaTerm;
  transactions: transaction[];
};

export function MvaMeldingPreview({
  termData,
  transactions,
}: MvaMeldingPreviewProps) {
  const [status, setStatus] = useState(termData.status);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitTerm({ year: termData.year, term: termData.term });
      setStatus("SUBMITTED");
    } catch {
      // Error handled by UI state remaining DRAFT
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            MVA-melding Termin {termData.term} ({formatTermLabel(termData.term)}
            ) {termData.year}
          </CardTitle>
          <Badge variant={status === "SUBMITTED" ? "default" : "secondary"}>
            {status === "SUBMITTED" ? "Levert" : "Utkast"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Frist: {formatDate(termData.deadline)} &middot;{" "}
          {transactions.length} transaksjoner
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead className="text-right">Grunnlag</TableHead>
              <TableHead className="text-right">Sats</TableHead>
              <TableHead className="text-right">MVA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Kode 52 - Utførsel</TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode52Grunnlag)}
              </TableCell>
              <TableCell className="text-right">0%</TableCell>
              <TableCell className="text-right">
                {formatCurrency(0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kode 86 - Beregnet</TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Grunnlag)}
              </TableCell>
              <TableCell className="text-right">25%</TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Mva)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kode 86 - Fradrag</TableCell>
              <TableCell className="text-right" />
              <TableCell className="text-right" />
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Fradrag)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kode 1 - Fradrag</TableCell>
              <TableCell className="text-right" />
              <TableCell className="text-right" />
              <TableCell className="text-right">
                {formatCurrency(termData.kode1MvaFradrag)}
              </TableCell>
            </TableRow>
            <TableRow className="font-bold">
              <TableCell>Sum MVA</TableCell>
              <TableCell className="text-right" />
              <TableCell className="text-right" />
              <TableCell
                className={`text-right ${termData.totalMva < 0 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                {formatCurrency(termData.totalMva)}
                {termData.totalMva < 0 && " (til gode)"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {status === "DRAFT" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={submitting}>Marker som levert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bekreft levering</AlertDialogTitle>
                <AlertDialogDescription>
                  Er du sikker på at du vil markere termin {termData.term} (
                  {formatTermLabel(termData.term)}) {termData.year} som levert?
                  Dette kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>
                  Bekreft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
