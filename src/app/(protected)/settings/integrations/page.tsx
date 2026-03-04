import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getStripeIntegration } from "@/features/integrations/Actions/getIntegration";
import { StripeConnectionCard } from "@/features/integrations/Components/StripeConnectionCard";
import { StripeSyncCard } from "@/features/integrations/Components/StripeSyncCard";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const integration = await getStripeIntegration();

  return (
    <div className="space-y-6">
      <StripeConnectionCard integration={integration} />
      {integration?.isActive && <StripeSyncCard />}
    </div>
  );
}
