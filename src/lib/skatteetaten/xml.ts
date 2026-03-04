import type { mvaTerm } from "@/generated/db/client";
import { TERM_PERIODS } from "./constants";

const SYSTEM_NAME = "Krono";
const SYSTEM_VERSION = "0.1.0";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatAmount(amount: number): string {
  return Math.round(amount).toString();
}

function getPeriodText(term: number): string {
  return TERM_PERIODS[term] ?? "januar-februar";
}

type MvaSpesifikasjonslinje = {
  mvaKode: string;
  grunnlag?: number;
  sats?: number;
  merverdiavgift: number;
};

function buildSpesifikasjonslinjer(termData: mvaTerm): MvaSpesifikasjonslinje[] {
  const linjer: MvaSpesifikasjonslinje[] = [];

  // Kode 52 — Utførsel (0% MVA, report grunnlag only)
  if (termData.kode52Grunnlag !== 0) {
    linjer.push({
      mvaKode: "52",
      grunnlag: termData.kode52Grunnlag,
      sats: 0,
      merverdiavgift: 0,
    });
  }

  // Kode 86 — Tjenester kjøpt fra utlandet (25% MVA)
  if (termData.kode86Grunnlag !== 0) {
    linjer.push({
      mvaKode: "86",
      grunnlag: termData.kode86Grunnlag,
      sats: 25,
      merverdiavgift: termData.kode86Mva,
    });
  }

  // Kode 86 fradrag (reported as kode 86 with negative MVA via separate line)
  if (termData.kode86Fradrag !== 0) {
    linjer.push({
      mvaKode: "86",
      merverdiavgift: termData.kode86Fradrag,
    });
  }

  // Kode 1 — Inngående MVA fradrag
  if (termData.kode1MvaFradrag !== 0) {
    linjer.push({
      mvaKode: "1",
      merverdiavgift: termData.kode1MvaFradrag,
    });
  }

  return linjer;
}

export function generateMvaMeldingXml(
  termData: mvaTerm,
  orgNr: string
): string {
  const periodText = getPeriodText(termData.term);
  const linjer = buildSpesifikasjonslinjer(termData);

  const spesifikasjonslinjerXml = linjer
    .map((linje) => {
      let inner = `      <mvaKode>${linje.mvaKode}</mvaKode>\n`;
      if (linje.grunnlag !== undefined) {
        inner += `      <grunnlag>${formatAmount(linje.grunnlag)}</grunnlag>\n`;
      }
      if (linje.sats !== undefined) {
        inner += `      <sats>${linje.sats}</sats>\n`;
      }
      inner += `      <merverdiavgift>${formatAmount(linje.merverdiavgift)}</merverdiavgift>`;
      return `    <mvaSpesifikasjonslinje>\n${inner}\n    </mvaSpesifikasjonslinje>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<mvaMeldingDto xmlns="no:skatteetaten:fastsetting:avgift:mva:skattemeldingformerverdiavgift:v1.0">
  <innsending>
    <regnskapssystemsreferanse>${escapeXml(SYSTEM_NAME)}</regnskapssystemsreferanse>
    <regnskapssystem>
      <systemnavn>${escapeXml(SYSTEM_NAME)}</systemnavn>
      <systemversjon>${escapeXml(SYSTEM_VERSION)}</systemversjon>
    </regnskapssystem>
  </innsending>
  <skattegrunnlagOgBeregnetSkatt>
    <skattleggingsperiode>
      <periode>${escapeXml(periodText)}</periode>
      <aar>${termData.year}</aar>
    </skattleggingsperiode>
    <fastsattMerverdiavgift>${formatAmount(termData.totalMva)}</fastsattMerverdiavgift>
${spesifikasjonslinjerXml}
  </skattegrunnlagOgBeregnetSkatt>
  <skattepliktig>
    <organisasjonsnummer>${escapeXml(orgNr)}</organisasjonsnummer>
  </skattepliktig>
  <meldingskategori>alminnelig</meldingskategori>
</mvaMeldingDto>`;
}

export function generateMvaInnsendingXml(
  termData: mvaTerm,
  orgNr: string
): string {
  const periodText = getPeriodText(termData.term);

  return `<?xml version="1.0" encoding="UTF-8"?>
<mvaMeldingInnsending xmlns="no:skatteetaten:fastsetting:avgift:mva:mvameldinginnsending:v1.0">
  <norskIdentifikator>${escapeXml(orgNr)}</norskIdentifikator>
  <skattleggingsperiode>
    <periode>${escapeXml(periodText)}</periode>
    <aar>${termData.year}</aar>
  </skattleggingsperiode>
  <meldingskategori>alminnelig</meldingskategori>
  <innsendingstype>komplett</innsendingstype>
  <instansstatus>default</instansstatus>
  <opprettetAv>${escapeXml(SYSTEM_NAME)}</opprettetAv>
  <vedleggsliste>
    <vedlegg>
      <vedleggstype>mva-melding</vedleggstype>
      <kildegruppe>vedlegg</kildegruppe>
      <opplestetFil>
        <filnavn>mva-melding.xml</filnavn>
        <filekstensjon>xml</filekstensjon>
        <filinnhold>mva-melding</filinnhold>
      </opplestetFil>
    </vedlegg>
  </vedleggsliste>
</mvaMeldingInnsending>`;
}
