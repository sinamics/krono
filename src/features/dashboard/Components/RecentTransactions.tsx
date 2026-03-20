"use client";

import type { transaction } from "@/generated/db/client";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

type RecentTransactionsProps = {
  transactions: transaction[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Siste transaksjoner</CardTitle>
        <CardAction>
          <Link
            href="/transactions"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Se alle
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Ingen transaksjoner ennå.
          </p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isSale = tx.type === "SALE";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={`shrink-0 rounded-lg p-2 ${
                      isSale
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isSale ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      isSale
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isSale ? "+" : "-"}
                    {formatCurrency(Math.abs(tx.amountNOK))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
