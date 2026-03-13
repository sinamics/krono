import { redirect } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/layout/Components/AppSidebar";
import { SidebarBreadcrumb } from "@/features/layout/Components/SidebarBreadcrumb";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const settings = await db.businessSettings.findUnique({
    where: { userId: session.userId },
    select: { businessName: true },
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={session.user} businessName={settings?.businessName ?? undefined} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <SidebarBreadcrumb />
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
