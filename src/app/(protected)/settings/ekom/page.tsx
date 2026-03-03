import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getSettings } from "@/features/settings/Actions/getSettings";
import { EkomSettingsForm } from "@/features/settings/Components/EkomSettingsForm";

export default async function EkomSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const settings = await getSettings(session.userId);

  return (
    <EkomSettingsForm
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
