import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { ProfileForm } from "@/features/settings/Components/ProfileForm";
import { ChangePasswordForm } from "@/features/settings/Components/ChangePasswordForm";
import { PasskeySettings } from "@/features/settings/Components/PasskeySettings";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm
          defaultValues={{
            name: session.user.name,
            email: session.user.email,
          }}
        />
        <ChangePasswordForm />
      </div>
      <PasskeySettings />
    </div>
  );
}
