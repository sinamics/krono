import { getAdminSettings } from "@/features/settings/Actions/adminSettings";
import { AdminSettingsForm } from "@/features/settings/Components/AdminSettingsForm";

export default async function AdminGeneralPage() {
  const settings = await getAdminSettings();

  return <AdminSettingsForm registrationEnabled={settings.registrationEnabled} />;
}
