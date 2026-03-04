"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import {
  generateMvaMeldingXml,
  generateMvaInnsendingXml,
} from "@/lib/skatteetaten/xml";
import { submitMvaMelding } from "@/lib/skatteetaten/api";
import { cookies } from "next/headers";

type SubmitInput = {
  year: number;
  term: number;
};

type SubmitResult = {
  success: boolean;
  instanceId?: string;
  error?: string;
};

export const submitToSkatteetaten = withAuth(
  async (auth, input: SubmitInput): Promise<SubmitResult> => {
    const { year, term } = input;

    // Get term data
    const termData = await db.mvaTerm.findUnique({
      where: {
        userId_year_term: {
          userId: auth.userId,
          year,
          term,
        },
      },
    });

    if (!termData) {
      throw new Error("MVA-termin finnes ikke. Beregn terminen først.");
    }

    if (termData.status === "SUBMITTED") {
      throw new Error("Denne terminen er allerede levert.");
    }

    // Get orgNr from business settings
    const settings = await db.businessSettings.findUnique({
      where: { userId: auth.userId },
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

    // Generate XML files
    const mvaMeldingXml = generateMvaMeldingXml(termData, settings.orgNr);
    const innsendingXml = generateMvaInnsendingXml(termData, settings.orgNr);

    // Submit to Skatteetaten
    const result = await submitMvaMelding(
      altinnToken,
      settings.orgNr,
      mvaMeldingXml,
      innsendingXml
    );

    // On success, mark term as SUBMITTED
    if (result.success) {
      await db.mvaTerm.update({
        where: { id: termData.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }

    return result;
  }
);
