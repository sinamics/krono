import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getStripeIntegration, getPaypalIntegration } from "@/features/integrations/Actions/getIntegration";
import { StripeConnectionCard } from "@/features/integrations/Components/StripeConnectionCard";
import { PaypalConnectionCard } from "@/features/integrations/Components/PaypalConnectionCard";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const [stripeIntegration, paypalIntegration] = await Promise.all([
    getStripeIntegration(),
    getPaypalIntegration(),
  ]);

  return (
    <div className="space-y-6">
      <StripeConnectionCard integration={stripeIntegration} />
      <PaypalConnectionCard integration={paypalIntegration} />
    </div>
  );
}
