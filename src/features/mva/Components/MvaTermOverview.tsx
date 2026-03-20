"use client";

import Link from "next/link";
import type { mvaTerm } from "@/generated/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTermLabel } from "@/lib/format";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type MvaTermOverviewProps = {
  terms: mvaTerm[];
};

function getStatus(term: mvaTerm) {
  if (term.status === "SUBMITTED") {
    return {
      label: "Levert",
      variant: "outline" as const,
      icon: CheckCircle2,
      border: "border-green-500/30",
      iconColor: "text-green-500",
      badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 text-xs",
    };
  }
  const now = new Date();
  if (new Date(term.deadline) < now) {
    return {
      label: "Forfalt",
      variant: "destructive" as const,
      icon: AlertTriangle,
      border: "border-red-500/30",
      iconColor: "text-red-500",
      badgeClassName: "text-xs",
    };
  }
  return {
    label: "Utkast",
    variant: "secondary" as const,
    icon: Clock,
    border: "border-border",
    iconColor: "text-muted-foreground",
    badgeClassName: "text-xs",
  };
}

export function MvaTermOverview({ terms }: MvaTermOverviewProps) {
  if (terms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ingen terminer beregnet for dette året ennå.
      </p>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {terms.map((term) => {
        const status = getStatus(term);
        const Icon = status.icon;

        return (
          <Link
            key={term.id}
            href={`/mva?year=${term.year}&term=${term.term}`}
          >
            <Card
              className={`${status.border} gap-0 p-4 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">Termin {term.term}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTermLabel(term.term)}
                  </p>
                </div>
                <Icon className={`size-4 ${status.iconColor} shrink-0`} />
              </div>

              <p
                className={`text-lg font-bold tabular-nums ${
                  term.totalMva < 0
                    ? "text-green-600 dark:text-green-400"
                    : ""
                }`}
              >
                {formatCurrency(term.totalMva)}
              </p>

              <div className="mt-2">
                <Badge variant={status.variant} className={status.badgeClassName}>
                  {status.label}
                </Badge>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
