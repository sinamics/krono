import { getUrls } from "./constants";

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type SubmissionResult = {
  success: boolean;
  instanceId: string;
  error?: string;
};

type FeedbackStatus = {
  status: string;
  feedbackUrl?: string;
};

export async function exchangeToken(idPortenToken: string): Promise<string> {
  const urls = getUrls();

  const response = await fetch(urls.altinnToken, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idPortenToken}`,
      Accept: "application/hal+json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const altinnToken = await response.text();
  return altinnToken.replace(/"/g, "");
}

export async function validateMvaMelding(
  xml: string,
  altinnToken: string
): Promise<ValidationResult> {
  const urls = getUrls();

  const response = await fetch(urls.validation, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${altinnToken}`,
      "Content-Type": "application/xml",
    },
    body: xml,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Validation request failed (${response.status}): ${text}`);
  }

  const result = await response.text();

  // Parse the XML validation response
  const errors: string[] = [];
  const warnings: string[] = [];

  const avvikRegex =
    /<avvik>[\s\S]*?<avvikTekst>([\s\S]*?)<\/avvikTekst>[\s\S]*?<detaljer>([\s\S]*?)<\/detaljer>[\s\S]*?<\/avvik>/g;
  let match;
  while ((match = avvikRegex.exec(result)) !== null) {
    errors.push(`${match[1]}: ${match[2]}`);
  }

  const varslerRegex =
    /<utvalgtMelding>[\s\S]*?<meldingTekst>([\s\S]*?)<\/meldingTekst>[\s\S]*?<\/utvalgtMelding>/g;
  while ((match = varslerRegex.exec(result)) !== null) {
    warnings.push(match[1]);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function submitMvaMelding(
  altinnToken: string,
  orgNr: string,
  mvaMeldingXml: string,
  innsendingXml: string
): Promise<SubmissionResult> {
  const urls = getUrls();
  const appBase = urls.appBase;

  // Step 1: Create instance
  const instanceResponse = await fetch(`${appBase}/instances/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${altinnToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceOwner: {
        organisationNumber: orgNr,
      },
    }),
  });

  if (!instanceResponse.ok) {
    const text = await instanceResponse.text();
    throw new Error(`Failed to create instance (${instanceResponse.status}): ${text}`);
  }

  const instance = await instanceResponse.json();
  const instanceId: string = instance.id;
  const selfUrl: string = instance.selfUrl ?? `${appBase}/instances/${instanceId}`;

  // Step 2: Find data endpoints from instance
  const dataUrl = `${selfUrl}/data`;

  // Step 3: Upload mvaMeldingInnsending XML
  const innsendingDataType = "mvaMeldingInnsending";
  const uploadInnsendingResponse = await fetch(
    `${dataUrl}?dataType=${innsendingDataType}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${altinnToken}`,
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="mvaMeldingInnsending.xml"',
      },
      body: innsendingXml,
    }
  );

  if (!uploadInnsendingResponse.ok) {
    const text = await uploadInnsendingResponse.text();
    throw new Error(
      `Failed to upload innsending (${uploadInnsendingResponse.status}): ${text}`
    );
  }

  // Step 4: Upload mva-melding XML
  const meldingDataType = "mvamelding";
  const uploadMeldingResponse = await fetch(
    `${dataUrl}?dataType=${meldingDataType}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${altinnToken}`,
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="mva-melding.xml"',
      },
      body: mvaMeldingXml,
    }
  );

  if (!uploadMeldingResponse.ok) {
    const text = await uploadMeldingResponse.text();
    throw new Error(
      `Failed to upload melding (${uploadMeldingResponse.status}): ${text}`
    );
  }

  // Step 5: Complete data filling — process/next
  const processNextResponse1 = await fetch(`${selfUrl}/process/next`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${altinnToken}`,
    },
  });

  if (!processNextResponse1.ok) {
    const text = await processNextResponse1.text();
    throw new Error(
      `Failed to complete data step (${processNextResponse1.status}): ${text}`
    );
  }

  // Step 6: Confirm submission — process/next again
  const processNextResponse2 = await fetch(`${selfUrl}/process/next`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${altinnToken}`,
    },
  });

  if (!processNextResponse2.ok) {
    const text = await processNextResponse2.text();
    throw new Error(
      `Failed to confirm submission (${processNextResponse2.status}): ${text}`
    );
  }

  return {
    success: true,
    instanceId,
  };
}

export async function getSubmissionStatus(
  altinnToken: string,
  instanceId: string
): Promise<FeedbackStatus> {
  const urls = getUrls();
  const appBase = urls.appBase;

  const response = await fetch(
    `${appBase}/instances/${instanceId}/feedback/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${altinnToken}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to get submission status (${response.status}): ${text}`
    );
  }

  return await response.json();
}
