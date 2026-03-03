import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { ProfileForm } from "@/features/settings/Components/ProfileForm";
import { ChangePasswordForm } from "@/features/settings/Components/ChangePasswordForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <ProfileForm
        defaultValues={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
