import { SettingsNav } from "./nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <h1 className="shrink-0 text-3xl font-bold">Innstillinger</h1>
      <div className="flex min-h-0 flex-1 gap-6">
        <SettingsNav />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
