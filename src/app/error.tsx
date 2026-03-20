"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Noe gikk galt</h1>
        <p className="text-lg text-muted-foreground">
          En uventet feil oppstod. Prøv igjen eller gå tilbake.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Prøv igjen</Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Gå tilbake
        </Button>
      </div>
    </div>
  );
}
