"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TermData } from "@/features/dashboard/Actions/getDashboardData";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type MvaTermsOverviewProps = {
  terms: TermData[];
  year: number;
  currentTerm: number;
};

function StatusBadge({ status }: { status: TermData["status"] }) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-[11px] px-1.5 py-0"
        >
          Levert
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="destructive" className="text-[11px] px-1.5 py-0">
          Forfalt
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
          Utkast
        </Badge>
      );
  }
}

export function MvaTermsOverview({
  terms,
  year,
  currentTerm,
}: MvaTermsOverviewProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2.5 border-b">
        <h2 className="text-sm font-semibold">MVA-terminer {year}</h2>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-6 px-4 py-2 border-b bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>Termin</span>
          <span className="text-right">Salg</span>
          <span className="text-right">Utgifter</span>
          <span className="text-right">MVA</span>
          <span className="text-right">Frist</span>
          <span className="text-right">Status</span>
        </div>
        {terms.map((t) => {
          const isCurrent = t.term === currentTerm && year === currentYear;
          return (
            <Link
              key={t.term}
              href={`/mva?year=${year}&term=${t.term}`}
              className={cn(
                "group grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-6 items-center px-4 py-2.5 border-b last:border-b-0 transition-colors hover:bg-accent/50",
                isCurrent && "bg-primary/[0.04]"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {isCurrent && (
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                )}
                <span>
                  T{t.term}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t.label}
                  </span>
                </span>
              </span>
              <span className="text-sm tabular-nums text-right text-green-600">
                {formatCurrency(t.salesTotal)}
              </span>
              <span className="text-sm tabular-nums text-right text-red-600">
                {formatCurrency(t.expensesTotal)}
              </span>
              <span className="text-sm tabular-nums text-right font-medium">
                {formatCurrency(t.totalMva)}
              </span>
              <span className="text-xs tabular-nums text-right text-muted-foreground">
                {formatDate(t.deadline)}
              </span>
              <span className="flex items-center justify-end gap-2">
                <StatusBadge status={t.status} />
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {terms.map((t) => {
          const isCurrent = t.term === currentTerm && year === currentYear;
          return (
            <Link
              key={t.term}
              href={`/mva?year=${year}&term=${t.term}`}
              className={cn(
                "block px-4 py-3 transition-colors active:bg-accent/50",
                isCurrent && "bg-primary/[0.04]"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {isCurrent && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  T{t.term} — {t.label}
                </span>
                <StatusBadge status={t.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Salg</span>
                  <p className="font-medium tabular-nums text-green-600">
                    {formatCurrency(t.salesTotal)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Utgifter</span>
                  <p className="font-medium tabular-nums text-red-600">
                    {formatCurrency(t.expensesTotal)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">MVA</span>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(t.totalMva)}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Frist: {formatDate(t.deadline)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
