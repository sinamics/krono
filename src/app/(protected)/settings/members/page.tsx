import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getMembers } from "@/features/settings/Actions/members";
import { MembersList } from "@/features/settings/Components/MembersList";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const members = await getMembers();

  return (
    <MembersList members={members} currentUserRole={session.role} />
  );
}
