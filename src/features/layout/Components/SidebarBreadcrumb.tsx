"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transaksjoner",
  "/mva": "MVA-melding",
  "/reports": "Rapporter",
  "/suppliers": "Leverandører",
  "/settings": "Innstillinger",
};

export function SidebarBreadcrumb() {
  const pathname = usePathname();

  const entry = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  );
  const title = entry?.[1] ?? "Side";
  const basePath = entry?.[0];
  const isSubpage = basePath && pathname !== basePath;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Krono</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {isSubpage ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={basePath}>{title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Detaljer</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
