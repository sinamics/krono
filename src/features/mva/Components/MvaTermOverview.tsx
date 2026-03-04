"use client";

import Link from "next/link";
import type { mvaTerm } from "@/generated/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatTermLabel } from "@/lib/format";

type MvaTermOverviewProps = {
  terms: mvaTerm[];
};

function getTermColor(term: mvaTerm): string {
  if (term.status === "SUBMITTED")
    return "border-green-500/50 bg-green-500/10";
  const now = new Date();
  if (new Date(term.deadline) < now)
    return "border-red-500/50 bg-red-500/10";
  return "border-yellow-500/50 bg-yellow-500/10";
}

function getStatusBadge(term: mvaTerm) {
  if (term.status === "SUBMITTED") {
    return <Badge variant="default">Levert</Badge>;
  }
  const now = new Date();
  if (new Date(term.deadline) < now) {
    return <Badge variant="destructive">Forfalt</Badge>;
  }
  return <Badge variant="secondary">Utkast</Badge>;
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
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {terms.map((term) => (
        <Link key={term.id} href={`/mva?year=${term.year}&term=${term.term}`}>
          <Card className={`${getTermColor(term)} transition-colors hover:bg-accent/50 cursor-pointer`}>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
              <span className="text-xs font-medium">Termin {term.term}</span>
              <span className="text-xs tabular-nums">{formatCurrency(term.totalMva)}</span>
              {getStatusBadge(term)}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
