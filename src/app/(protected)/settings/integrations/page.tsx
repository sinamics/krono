import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getIntegrations } from "@/features/integrations/Actions/getIntegration";
import { StripeConnectionCard } from "@/features/integrations/Components/StripeConnectionCard";
import { PaypalConnectionCard } from "@/features/integrations/Components/PaypalConnectionCard";
import { FixExchangeRatesButton } from "@/features/transactions/Components/FixExchangeRatesButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const [stripeIntegrations, paypalIntegrations] = await Promise.all([
    getIntegrations("stripe"),
    getIntegrations("paypal"),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <StripeConnectionCard integrations={stripeIntegrations} />
        <PaypalConnectionCard integrations={paypalIntegrations} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valutakurser</CardTitle>
          <CardDescription>
            Valutakurser fra Norges Bank oppdateres automatisk hver dag kl. 06:00. Du kan også kjøre en manuell oppdatering nedenfor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FixExchangeRatesButton />
        </CardContent>
      </Card>
    </div>
  );
}
