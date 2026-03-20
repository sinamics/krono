import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getSettings } from "@/features/settings/Actions/getSettings";
import { BusinessInfoForm } from "@/features/settings/Components/BusinessInfoForm";
import { EkomSettingsForm } from "@/features/settings/Components/EkomSettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const settings = await getSettings(session.organizationId);

  const defaultValues = {
    orgNr: settings?.orgNr ?? "",
    businessName: settings?.businessName ?? "",
    address: settings?.address ?? "",
    ekomPrivatePercent: settings?.ekomPrivatePercent ?? 0,
    defaultCurrency:
      (settings?.defaultCurrency as "NOK" | "EUR" | "USD") ?? "NOK",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BusinessInfoForm defaultValues={defaultValues} />
      <EkomSettingsForm defaultValues={defaultValues} />
    </div>
  );
}
