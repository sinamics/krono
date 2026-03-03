"use client";

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {terms.map((term) => (
        <Card key={term.id} className={getTermColor(term)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Termin {term.term} ({formatTermLabel(term.term)})
              </CardTitle>
              {getStatusBadge(term)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(term.totalMva)}
            </p>
            <p className="text-xs text-muted-foreground">
              Frist: {formatDate(term.deadline)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
