"use client";

import type { YearToDateData } from "@/features/dashboard/Actions/getDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type DashboardStatsProps = {
  yearToDate: YearToDateData;
};

export function DashboardStats({ yearToDate }: DashboardStatsProps) {
  const items = [
    {
      title: "Salg i år",
      value: formatCurrency(yearToDate.totalSales),
    },
    {
      title: "Utgifter i år",
      value: formatCurrency(yearToDate.totalExpenses),
    },
    {
      title: "Nettoresultat",
      value: formatCurrency(yearToDate.netResult),
      colorClass: yearToDate.netResult >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Transaksjoner",
      value: yearToDate.transactionCount.toString(),
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
                "colorClass" in item && item.colorClass ? item.colorClass : ""
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
