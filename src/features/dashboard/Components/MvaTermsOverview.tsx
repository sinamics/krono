"use client";

import Link from "next/link";
import type { TermData } from "@/features/dashboard/Actions/getDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getTermFromDate } from "@/lib/format";

type MvaTermsOverviewProps = {
  terms: TermData[];
  year: number;
};

function getStatusBadge(status: TermData["status"]) {
  switch (status) {
    case "SUBMITTED":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Levert</Badge>;
    case "OVERDUE":
      return <Badge variant="destructive">Forfalt</Badge>;
    default:
      return <Badge variant="secondary">Utkast</Badge>;
  }
}

export function MvaTermsOverview({ terms, year }: MvaTermsOverviewProps) {
  const currentTerm = getTermFromDate(new Date());
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">MVA-terminer {year}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {terms.map((t) => {
          const isCurrent = t.term === currentTerm && year === currentYear;
          return (
            <Link
              key={t.term}
              href={`/mva?year=${year}&term=${t.term}`}
              className="block"
            >
              <Card
                className={`transition-colors hover:border-primary/50 h-full ${
                  isCurrent ? "border-primary border-2" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Termin {t.term} — {t.label}
                    </CardTitle>
                    {getStatusBadge(t.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salg</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(t.salesTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utgifter</span>
                    <span className="text-red-600 font-medium">
                      {formatCurrency(t.expensesTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="text-muted-foreground">MVA</span>
                    <span className="font-semibold">
                      {formatCurrency(t.totalMva)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Frist: {formatDate(t.deadline)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
