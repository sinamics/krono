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
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate, formatTermLabel } from "@/lib/format";
import { submitTerm } from "@/features/mva/Actions/submitTerm";
import { reopenTerm } from "@/features/mva/Actions/reopenTerm";

// Common recurring expense categories for Norwegian ENK businesses
const EXPECTED_CATEGORIES: { key: string; label: string; matches: string[] }[] =
  [
    {
      key: "internet",
      label: "Internett / Bredbånd",
      matches: ["internet", "internett", "bredbånd", "bredband", "ekom"],
    },
    {
      key: "telefon",
      label: "Telefon / Mobil",
      matches: ["telefon", "mobil"],
    },
    {
      key: "programvare",
      label: "Programvare / Abonnement",
      matches: ["programvare", "abonnement", "software"],
    },
    {
      key: "hosting",
      label: "Hosting / Server",
      matches: ["hosting", "server"],
    },
    {
      key: "regnskap",
      label: "Regnskap",
      matches: ["regnskap"],
    },
    {
      key: "forsikring",
      label: "Forsikring",
      matches: ["forsikring"],
    },
  ];

function getTermChecklist(
  transactions: transaction[],
  missingSuppliers: { id: string; name: string }[]
) {
  const presentCategories = new Set(
    transactions
      .filter((tx) => tx.type === "EXPENSE" && tx.category)
      .map((tx) => tx.category!.toLowerCase())
  );

  const warnings: string[] = [];
  const passed: string[] = [];

  for (const cat of EXPECTED_CATEGORIES) {
    const found = cat.matches.some((m) => presentCategories.has(m));
    if (found) {
      passed.push(cat.label);
    } else {
      warnings.push(cat.label);
    }
  }

  if (missingSuppliers.length > 0) {
    for (const s of missingSuppliers) {
      warnings.push(`Leverandør: ${s.name}`);
    }
  }

  return { warnings, passed };
}

type MvaMeldingPreviewProps = {
  termData: mvaTerm;
  transactions: transaction[];
  missingSuppliers?: { id: string; name: string }[];
};

export function MvaMeldingPreview({
  termData,
  transactions,
  missingSuppliers = [],
}: MvaMeldingPreviewProps) {
  const [status, setStatus] = useState(termData.status);
  const [submitting, setSubmitting] = useState(false);
  const { warnings, passed } = getTermChecklist(transactions, missingSuppliers);

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

  async function handleReopen() {
    setSubmitting(true);
    try {
      await reopenTerm({ year: termData.year, term: termData.term });
      setStatus("DRAFT");
    } catch {
      // Error handled by UI state remaining SUBMITTED
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
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Bekreft levering</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Er du sikker på at du vil markere termin {termData.term} (
                      {formatTermLabel(termData.term)}) {termData.year} som
                      levert? Transaksjonene vil bli låst for redigering.
                    </p>

                    {warnings.length > 0 && (
                      <div className="rounded-md border p-3 space-y-2">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="size-4 text-amber-500" />
                          Mangler i denne terminen
                        </p>
                        <ul className="space-y-1">
                          {warnings.map((w) => (
                            <li
                              key={w}
                              className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
                            >
                              <span className="size-1 rounded-full bg-amber-500 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {passed.length > 0 && (
                      <div className="space-y-1">
                        {passed.map((p) => (
                          <div
                            key={p}
                            className="text-sm text-muted-foreground flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5 text-green-500" />
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

        {status === "SUBMITTED" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={submitting}>
                Gjenåpne termin
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gjenåpne termin</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil sette termin {termData.term} (
                  {formatTermLabel(termData.term)}) {termData.year} tilbake til
                  utkast. Transaksjonene vil bli låst opp for redigering.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleReopen}>
                  Gjenåpne
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
