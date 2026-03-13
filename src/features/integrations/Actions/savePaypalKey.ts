"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { paypalKeySchema } from "../Schema/integrationSchema";

export const savePaypalKey = withAuth(async (auth, formData: unknown) => {
  const { clientId, secret } = paypalKeySchema.parse(formData);

  // Validate credentials by fetching an OAuth2 token
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error("Ugyldig PayPal-legitimasjon. Kunne ikke koble til PayPal.");
  }

  await db.integration.upsert({
    where: {
      organizationId_provider: {
        organizationId: auth.organizationId,
        provider: "paypal",
      },
    },
    create: {
      organizationId: auth.organizationId,
      provider: "paypal",
      apiKey: JSON.stringify({ clientId, secret }),
      isActive: true,
    },
    update: {
      apiKey: JSON.stringify({ clientId, secret }),
      isActive: true,
    },
  });

  return { success: true };
});

export const disconnectPaypal = withAuth(async (auth) => {
  await db.integration.deleteMany({
    where: {
      organizationId: auth.organizationId,
      provider: "paypal",
    },
  });

  return { success: true };
});
