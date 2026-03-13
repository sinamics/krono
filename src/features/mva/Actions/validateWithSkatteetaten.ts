"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { generateMvaMeldingXml } from "@/lib/skatteetaten/xml";
import { validateMvaMelding, exchangeToken } from "@/lib/skatteetaten/api";
import { cookies } from "next/headers";

type ValidateInput = {
  year: number;
  term: number;
};

type ValidateResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const validateWithSkatteetaten = withAuth(
  async (auth, input: ValidateInput): Promise<ValidateResult> => {
    const { year, term } = input;

    // Get term data
    const termData = await db.mvaTerm.findUnique({
      where: {
        organizationId_year_term: {
          organizationId: auth.organizationId,
          year,
          term,
        },
      },
    });

    if (!termData) {
      throw new Error("MVA-termin finnes ikke. Beregn terminen først.");
    }

    // Get orgNr from business settings
    const settings = await db.businessSettings.findUnique({
      where: { organizationId: auth.organizationId },
    });

    if (!settings?.orgNr) {
      throw new Error(
        "Organisasjonsnummer mangler. Oppdater bedriftsinnstillinger."
      );
    }

    // Get Altinn token from cookie
    const cookieStore = await cookies();
    const altinnToken = cookieStore.get("altinn_token")?.value;

    if (!altinnToken) {
      throw new Error("NEEDS_AUTH");
    }

    // Generate XML
    const xml = generateMvaMeldingXml(termData, settings.orgNr);

    // Validate with Skatteetaten
    const result = await validateMvaMelding(xml, altinnToken);

    return result;
  }
);
