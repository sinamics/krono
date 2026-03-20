import { Separator } from "@/components/ui/separator";
import { SettingsNav } from "./nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Innstillinger</h1>
        <p className="text-sm text-muted-foreground">
          Administrer innstillinger for din organisasjon
        </p>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 gap-3">
        <SettingsNav />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
