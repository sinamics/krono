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
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Send,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate, formatTermLabel } from "@/lib/format";
import { submitTerm } from "@/features/mva/Actions/submitTerm";
import { reopenTerm } from "@/features/mva/Actions/reopenTerm";
import { validateWithSkatteetaten } from "@/features/mva/Actions/validateWithSkatteetaten";
import { submitToSkatteetaten } from "@/features/mva/Actions/submitToSkatteetaten";
import { getUrls } from "@/lib/skatteetaten/constants";

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

function TransactionRows({ transactions }: { transactions: transaction[] }) {
  if (transactions.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={4}
          className="text-center text-sm text-muted-foreground bg-muted/30 py-2"
        >
          Ingen transaksjoner
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {transactions.map((tx) => (
        <TableRow
          key={tx.id}
          className="bg-muted/30 text-sm cursor-pointer hover:bg-muted/60"
          onClick={() => window.open(`/transactions/${tx.id}`, "_blank")}
        >
          <TableCell className="pl-9 py-1.5">
            <span className="text-muted-foreground mr-2">
              {formatDate(tx.date)}
            </span>
            {tx.description}
            <ExternalLink className="ml-1.5 inline size-3 text-muted-foreground" />
          </TableCell>
          <TableCell className="text-right py-1.5">
            {formatCurrency(tx.amountNOK)}
          </TableCell>
          <TableCell className="text-right py-1.5" />
          <TableCell className="text-right py-1.5" />
        </TableRow>
      ))}
    </>
  );
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
  const [validating, setValidating] = useState(false);
  const [skattSubmitting, setSkattSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [skattResult, setSkattResult] = useState<{
    success: boolean;
    instanceId?: string;
    error?: string;
  } | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const { warnings, passed } = getTermChecklist(transactions, missingSuppliers);

  function getTransactionsForCode(code: string): transaction[] {
    return transactions.filter((tx) => tx.mvaCode === code);
  }

  function toggleCode(code: string) {
    setExpandedCode((prev) => (prev === code ? null : code));
  }

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

  function openIdPortenLogin() {
    const clientId = process.env.NEXT_PUBLIC_IDPORTEN_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_IDPORTEN_REDIRECT_URI;
    const urls = getUrls();
    const state = `${termData.year}-${termData.term}`;
    const scope =
      "openid skatteetaten:mvameldingvalidering skatteetaten:mvameldinginnsending";

    const authUrl = new URL(urls.idPortenAuth);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId ?? "");
    authUrl.searchParams.set("redirect_uri", redirectUri ?? "");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", crypto.randomUUID());

    window.open(authUrl.toString(), "_blank", "width=600,height=700");
  }

  async function handleValidate() {
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateWithSkatteetaten({
        year: termData.year,
        term: termData.term,
      });
      setValidationResult(result);
    } catch (err) {
      if (err instanceof Error && err.message === "NEEDS_AUTH") {
        openIdPortenLogin();
      } else {
        setValidationResult({
          valid: false,
          errors: [
            err instanceof Error ? err.message : "Ukjent feil ved validering",
          ],
          warnings: [],
        });
      }
    } finally {
      setValidating(false);
    }
  }

  async function handleSkattSubmit() {
    setSkattSubmitting(true);
    setSkattResult(null);
    try {
      const result = await submitToSkatteetaten({
        year: termData.year,
        term: termData.term,
      });
      setSkattResult(result);
      if (result.success) {
        setStatus("SUBMITTED");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "NEEDS_AUTH") {
        openIdPortenLogin();
      } else {
        setSkattResult({
          success: false,
          error:
            err instanceof Error ? err.message : "Ukjent feil ved innsending",
        });
      }
    } finally {
      setSkattSubmitting(false);
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
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleCode("CODE_52")}
            >
              <TableCell className="flex items-center gap-1.5">
                {expandedCode === "CODE_52" ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                Kode 52 - Utførsel
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode52Grunnlag)}
              </TableCell>
              <TableCell className="text-right">0%</TableCell>
              <TableCell className="text-right">
                {formatCurrency(0)}
              </TableCell>
            </TableRow>
            {expandedCode === "CODE_52" && (
              <TransactionRows transactions={getTransactionsForCode("CODE_52")} />
            )}
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleCode("CODE_86")}
            >
              <TableCell className="flex items-center gap-1.5">
                {expandedCode === "CODE_86" ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                Kode 86 - Beregnet
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Grunnlag)}
              </TableCell>
              <TableCell className="text-right">25%</TableCell>
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Mva)}
              </TableCell>
            </TableRow>
            {expandedCode === "CODE_86" && (
              <TransactionRows transactions={getTransactionsForCode("CODE_86")} />
            )}
            <TableRow>
              <TableCell className="pl-9">Kode 86 - Fradrag</TableCell>
              <TableCell className="text-right" />
              <TableCell className="text-right" />
              <TableCell className="text-right">
                {formatCurrency(termData.kode86Fradrag)}
              </TableCell>
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleCode("CODE_1")}
            >
              <TableCell className="flex items-center gap-1.5">
                {expandedCode === "CODE_1" ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                Kode 1 - Fradrag
              </TableCell>
              <TableCell className="text-right" />
              <TableCell className="text-right" />
              <TableCell className="text-right">
                {formatCurrency(termData.kode1MvaFradrag)}
              </TableCell>
            </TableRow>
            {expandedCode === "CODE_1" && (
              <TransactionRows transactions={getTransactionsForCode("CODE_1")} />
            )}
            <TableRow className="font-bold">
              <TableCell className="pl-9">Sum MVA</TableCell>
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
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={validating || skattSubmitting}
                onClick={handleValidate}
              >
                {validating ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4 mr-2" />
                )}
                Valider hos Skatteetaten
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={validating || skattSubmitting}>
                    {skattSubmitting ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="size-4 mr-2" />
                    )}
                    Send til Skatteetaten
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Send MVA-melding til Skatteetaten
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          Du er i ferd med å sende MVA-meldingen for termin{" "}
                          {termData.term} ({formatTermLabel(termData.term)}){" "}
                          {termData.year} til Skatteetaten. Du må logge inn med
                          ID-porten hvis du ikke allerede er innlogget.
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
                    <AlertDialogAction onClick={handleSkattSubmit}>
                      Send inn
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" disabled={submitting}>
                    Marker som levert
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bekreft levering</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          Er du sikker på at du vil markere termin{" "}
                          {termData.term} ({formatTermLabel(termData.term)}){" "}
                          {termData.year} som levert? Transaksjonene vil bli låst
                          for redigering.
                        </p>
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
            </div>

            {validationResult && (
              <div
                className={`rounded-md border p-3 space-y-2 ${
                  validationResult.valid
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                }`}
              >
                <p
                  className={`text-sm font-medium flex items-center gap-1.5 ${
                    validationResult.valid
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {validationResult.valid ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                  {validationResult.valid
                    ? "Validering godkjent"
                    : "Validering feilet"}
                </p>
                {validationResult.errors.map((e, i) => (
                  <p
                    key={i}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {e}
                  </p>
                ))}
                {validationResult.warnings.map((w, i) => (
                  <p
                    key={i}
                    className="text-sm text-amber-600 dark:text-amber-400"
                  >
                    {w}
                  </p>
                ))}
              </div>
            )}

            {skattResult && !skattResult.success && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-4" />
                  Innsending feilet
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {skattResult.error}
                </p>
              </div>
            )}
          </div>
        )}

        {status === "SUBMITTED" && (
          <div className="space-y-3">
            {termData.submittedAt && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green-500" />
                Sendt til Skatteetaten {formatDate(termData.submittedAt)}
              </p>
            )}

            {skattResult?.success && skattResult.instanceId && (
              <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  MVA-melding sendt inn
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Instans-ID: {skattResult.instanceId}
                </p>
              </div>
            )}

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
