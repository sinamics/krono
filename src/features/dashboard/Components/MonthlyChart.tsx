"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { MonthlyData } from "../Actions/getDashboardData";
import { formatCurrency } from "@/lib/format";

type Props = {
  data: MonthlyData[];
  year: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-sm">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{
              backgroundColor:
                entry.dataKey === "sales"
                  ? "var(--color-emerald)"
                  : "var(--color-red)",
            }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === "sales" ? "Salg" : "Utgifter"}:
          </span>
          <span className="font-medium ml-auto tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyChart({ data, year }: Props) {
  return (
    <Card
      className="h-full"
      style={
        {
          "--color-emerald": "#10b981",
          "--color-red": "#ef4444",
        } as React.CSSProperties
      }
    >
      <CardHeader>
        <CardTitle>Månedlig oversikt</CardTitle>
        <CardDescription>Salg og utgifter per måned i {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Salg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Utgifter</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
              }
              width={50}
              className="fill-muted-foreground"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-accent)", opacity: 0.5 }}
            />
            <Bar
              dataKey="sales"
              name="Salg"
              fill="var(--color-emerald)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expenses"
              name="Utgifter"
              fill="var(--color-red)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
