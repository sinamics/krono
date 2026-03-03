import { SettingsNav } from "./nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Innstillinger</h1>
      <div className="flex gap-6">
        <SettingsNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
