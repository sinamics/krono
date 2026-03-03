"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          MVA-regnskap for enkeltpersonforetak
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Automatiser MVA-beregninger, hold orden på transaksjoner og generer
          ferdig utfylte MVA-meldinger for Skatteetaten.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">Kom i gang</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Logg inn</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
