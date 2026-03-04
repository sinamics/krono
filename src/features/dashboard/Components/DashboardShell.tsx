"use client";

import { useRouter } from "next/navigation";
import type { DashboardData } from "@/features/dashboard/Actions/getDashboardData";
import { DashboardStats } from "./DashboardStats";
import { MonthlyChart } from "./MonthlyChart";
import { MvaTermsOverview } from "./MvaTermsOverview";
import { RecentTransactions } from "./RecentTransactions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardShellProps = {
  data: DashboardData;
  year: number;
};

export function DashboardShell({ data, year }: DashboardShellProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Finansiell oversikt{" "}
            {year === currentYear ? `${year}` : `for ${year}`}
          </p>
        </div>
        <Select
          value={year.toString()}
          onValueChange={(v) => router.push(`/dashboard?year=${v}`)}
        >
          <SelectTrigger className="w-[100px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DashboardStats yearToDate={data.yearToDate} />

      <MonthlyChart data={data.monthly} year={year} />

      <MvaTermsOverview
        terms={data.allTerms}
        year={year}
        currentTerm={data.currentTerm}
      />

      <RecentTransactions transactions={data.recentTransactions} />
    </div>
  );
}
