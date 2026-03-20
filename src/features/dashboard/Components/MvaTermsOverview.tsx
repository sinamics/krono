"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TermData } from "@/features/dashboard/Actions/getDashboardData";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type MvaTermsOverviewProps = {
  terms: TermData[];
  year: number;
  currentTerm: number;
};

function MissingSuppliersBadge({
  missingSuppliers,
}: {
  missingSuppliers: TermData["missingSuppliers"];
}) {
  const [open, setOpen] = useState(false);

  if (missingSuppliers.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="cursor-pointer"
        >
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20 text-[11px] px-1.5 py-0"
          >
            {missingSuppliers.length} mangler
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <p className="text-xs font-medium mb-2 text-muted-foreground">
          Leverandører fra forrige termin
        </p>
        <ul className="space-y-1">
          {missingSuppliers.map((s) => (
            <li key={s.id} className="text-sm">
              {s.name}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function StatusBadge({ status }: { status: TermData["status"] }) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 text-[11px] px-1.5 py-0"
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
    <Card>
      <CardHeader>
        <CardTitle>MVA-terminer</CardTitle>
        <CardDescription>Oversikt over alle terminer i {year}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1fr_7rem_7rem_7rem_6rem_6rem] gap-x-4 px-6 pb-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Termin</span>
            <span className="text-right">Salg</span>
            <span className="text-right">Utgifter</span>
            <span className="text-right">MVA</span>
            <span className="text-right">Frist</span>
            <span className="text-right">Status</span>
          </div>
          <div className="border-t">
            {terms.map((t) => {
              const isCurrent = t.term === currentTerm && year === currentYear;
              return (
                <Link
                  key={t.term}
                  href={`/mva?year=${year}&term=${t.term}`}
                  className={cn(
                    "group grid grid-cols-[1fr_7rem_7rem_7rem_6rem_6rem] gap-x-4 items-center px-6 py-3 border-b last:border-b-0 transition-colors hover:bg-accent/50",
                    isCurrent && "bg-primary/[0.03]"
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
                    <MissingSuppliersBadge
                      missingSuppliers={t.missingSuppliers}
                    />
                  </span>
                  <span className="text-sm tabular-nums text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(t.salesTotal)}
                  </span>
                  <span className="text-sm tabular-nums text-right text-red-600 dark:text-red-400">
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
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          <div className="border-t">
            {terms.map((t) => {
              const isCurrent = t.term === currentTerm && year === currentYear;
              return (
                <Link
                  key={t.term}
                  href={`/mva?year=${year}&term=${t.term}`}
                  className={cn(
                    "block px-6 py-3.5 border-b last:border-b-0 transition-colors active:bg-accent/50",
                    isCurrent && "bg-primary/[0.03]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {isCurrent && (
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      T{t.term} — {t.label}
                      <MissingSuppliersBadge
                        missingSuppliers={t.missingSuppliers}
                      />
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Salg</span>
                      <p className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(t.salesTotal)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Utgifter</span>
                      <p className="font-medium tabular-nums text-red-600 dark:text-red-400">
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
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Frist: {formatDate(t.deadline)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
