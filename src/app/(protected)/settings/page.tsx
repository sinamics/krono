import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getSettings } from "@/features/settings/Actions/getSettings";
import { BusinessInfoForm } from "@/features/settings/Components/BusinessInfoForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const settings = await getSettings(session.organizationId);

  return (
    <BusinessInfoForm
      defaultValues={{
        orgNr: settings?.orgNr ?? "",
        businessName: settings?.businessName ?? "",
        address: settings?.address ?? "",
        ekomPrivatePercent: settings?.ekomPrivatePercent ?? 0,
        defaultCurrency:
          (settings?.defaultCurrency as "NOK" | "EUR" | "USD") ?? "NOK",
      }}
    />
  );
}
