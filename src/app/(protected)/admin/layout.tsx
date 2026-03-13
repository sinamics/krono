import { redirect } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <h1 className="shrink-0 text-3xl font-bold">Super Admin</h1>
      <div className="flex min-h-0 flex-1 gap-6">
        <AdminNav />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
