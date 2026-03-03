"use client";

import {
  Calculator,
  ArrowRightLeft,
  FileText,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Automatisk MVA-beregning",
    description:
      "Beregn inngående og utgående MVA automatisk basert på riktige satser og koder.",
    icon: Calculator,
  },
  {
    title: "Transaksjonsregistrering",
    description:
      "Registrer inntekter og utgifter enkelt med riktig MVA-kode og leverandørkobling.",
    icon: ArrowRightLeft,
  },
  {
    title: "MVA-melding",
    description:
      "Generer ferdig utfylte MVA-meldinger klare for innsending til Skatteetaten.",
    icon: FileText,
  },
  {
    title: "Rapporter",
    description:
      "Få oversikt over økonomi, MVA-saldo og transaksjoner med detaljerte rapporter.",
    icon: BarChart3,
  },
];

export function Features() {
  return (
    <section className="border-t bg-muted/50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h3 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Alt du trenger for MVA-regnskapet
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
