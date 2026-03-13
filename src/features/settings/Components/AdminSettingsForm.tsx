"use client";

import { useState, useTransition } from "react";
import { updateAdminSettings } from "../Actions/adminSettings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  registrationEnabled: boolean;
};

export function AdminSettingsForm({ registrationEnabled: initial }: Props) {
  const [registrationEnabled, setRegistrationEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateAdminSettings({ registrationEnabled });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brukerregistrering</CardTitle>
        <CardDescription>
          Kontroller om nye brukere kan registrere seg i systemet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="registration-toggle">Tillat registrering</Label>
            <p className="text-sm text-muted-foreground">
              Når dette er av kan ingen nye brukere opprette konto.
            </p>
          </div>
          <Switch
            id="registration-toggle"
            checked={registrationEnabled}
            onCheckedChange={setRegistrationEnabled}
          />
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Lagrer…" : saved ? "Lagret" : "Lagre"}
        </Button>
      </CardContent>
    </Card>
  );
}
