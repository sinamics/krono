"use client";

import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Receipt,
} from "lucide-react";
import type { YearToDateData } from "@/features/dashboard/Actions/getDashboardData";
import { formatCurrency } from "@/lib/format";

type DashboardStatsProps = {
  yearToDate: YearToDateData;
};

export function DashboardStats({ yearToDate }: DashboardStatsProps) {
  const isPositive = yearToDate.netResult >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border">
      <div className="bg-card p-4 flex items-center gap-3">
        <div className="shrink-0 rounded-md bg-green-500/10 p-2 text-green-600">
          <TrendingUp className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">Salg i år</p>
          <p className="text-lg font-semibold tabular-nums tracking-tight">
            {formatCurrency(yearToDate.totalSales)}
          </p>
        </div>
      </div>

      <div className="bg-card p-4 flex items-center gap-3">
        <div className="shrink-0 rounded-md bg-red-500/10 p-2 text-red-600">
          <TrendingDown className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">Utgifter i år</p>
          <p className="text-lg font-semibold tabular-nums tracking-tight">
            {formatCurrency(yearToDate.totalExpenses)}
          </p>
        </div>
      </div>

      <div className="bg-card p-4 flex items-center gap-3">
        <div
          className={`shrink-0 rounded-md p-2 ${
            isPositive
              ? "bg-green-500/10 text-green-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          <ArrowUpDown className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">Nettoresultat</p>
          <p
            className={`text-lg font-semibold tabular-nums tracking-tight ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(yearToDate.netResult)}
          </p>
        </div>
      </div>

      <div className="bg-card p-4 flex items-center gap-3">
        <div className="shrink-0 rounded-md bg-blue-500/10 p-2 text-blue-600">
          <Receipt className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">Transaksjoner</p>
          <p className="text-lg font-semibold tabular-nums tracking-tight">
            {yearToDate.transactionCount}
          </p>
        </div>
      </div>
    </div>
  );
}
