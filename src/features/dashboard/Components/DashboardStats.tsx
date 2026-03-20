"use client";

import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { YearToDateData } from "@/features/dashboard/Actions/getDashboardData";
import { formatCurrency } from "@/lib/format";

type DashboardStatsProps = {
  yearToDate: YearToDateData;
};

export function DashboardStats({ yearToDate }: DashboardStatsProps) {
  const isPositive = yearToDate.netResult >= 0;

  const stats = [
    {
      label: "Salg i år",
      value: formatCurrency(yearToDate.totalSales),
      icon: TrendingUp,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Utgifter i år",
      value: formatCurrency(yearToDate.totalExpenses),
      icon: TrendingDown,
      iconClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10",
    },
    {
      label: "Nettoresultat",
      value: formatCurrency(yearToDate.netResult),
      valueClass: isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
      icon: Scale,
      iconClass: isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
      bgClass: isPositive ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      label: "Transaksjoner",
      value: yearToDate.transactionCount.toString(),
      icon: Receipt,
      iconClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className={`shrink-0 rounded-lg p-2.5 ${stat.bgClass}`}>
              <stat.icon className={`size-4 ${stat.iconClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {stat.label}
              </p>
              <p
                className={`text-lg font-semibold tabular-nums tracking-tight ${stat.valueClass ?? ""}`}
              >
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
