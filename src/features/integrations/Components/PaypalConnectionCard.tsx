"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaypalAccountRow } from "./PaypalAccountRow";
import { AddPaypalDialog } from "./AddPaypalDialog";
import type { IntegrationItem } from "../Actions/getIntegration";

interface Props {
  integrations: IntegrationItem[];
}

export function PaypalConnectionCard({ integrations }: Props) {
  const count = integrations.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>PayPal</CardTitle>
            <CardDescription>
              Importer salg og gebyrer automatisk fra PayPal.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {count > 0 ? (
              <Badge variant="default">
                {count} {count === 1 ? "konto" : "kontoer"}
              </Badge>
            ) : (
              <Badge variant="secondary">Ingen kontoer</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {count > 0 ? (
          <div className="mb-4">
            {integrations.map((account) => (
              <PaypalAccountRow key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Ingen PayPal-kontoer koblet til.
          </p>
        )}
        <AddPaypalDialog />
      </CardContent>
    </Card>
  );
}
