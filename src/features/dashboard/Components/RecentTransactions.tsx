"use client";

import type { transaction } from "@/generated/db/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

type RecentTransactionsProps = {
  transactions: transaction[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Siste transaksjoner</CardTitle>
          <Link
            href="/transactions"
            className="text-sm text-muted-foreground hover:underline"
          >
            Se alle
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen transaksjoner denne terminen.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-muted-foreground">
                    {formatDate(tx.date)}
                  </p>
                </div>
                <p
                  className={`font-medium ${
                    tx.type === "SALE" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "SALE" ? "+" : "-"}
                  {formatCurrency(Math.abs(tx.amountNOK))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
