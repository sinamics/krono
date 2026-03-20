"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  UserCircle,
  Users,
  Plug,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: "Generelt",
    items: [
      { title: "Regnskap", href: "/settings", icon: Building2 },
    ],
  },
  {
    label: "Brukere",
    items: [
      { title: "Profil", href: "/settings/profile", icon: UserCircle },
      { title: "Medlemmer", href: "/settings/members", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Integrasjoner",
        href: "/settings/integrations",
        icon: Plug,
      },
      { title: "Backup", href: "/settings/backup", icon: HardDrive },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 rounded-lg border bg-accent/30 p-2.5">
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <h4 className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </h4>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
