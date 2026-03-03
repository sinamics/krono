"use client";

import type { DashboardStatsData } from "@/features/dashboard/Actions/getDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

type DashboardStatsProps = {
  stats: DashboardStatsData;
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const items = [
    {
      title: "Salg denne terminen",
      value: formatCurrency(stats.salesTotal),
    },
    {
      title: "Utgifter denne terminen",
      value: formatCurrency(stats.expensesTotal),
    },
    {
      title: "MVA-posisjon",
      value: formatCurrency(stats.mvaPosition),
      highlight: stats.mvaPosition < 0,
    },
    {
      title: "Neste frist",
      value: formatDate(stats.nextDeadline),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                "highlight" in item && item.highlight
                  ? "text-green-600"
                  : ""
              }`}
            >
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
