"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { paypalKeySchema } from "../Schema/integrationSchema";
import { z } from "zod";

export const savePaypalKey = withAuth(async (auth, formData: unknown) => {
  const { clientId, secret, name } = paypalKeySchema.parse(formData);

  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(
      "Ugyldig PayPal-legitimasjon. Kunne ikke koble til PayPal."
    );
  }

  await db.integration.create({
    data: {
      organizationId: auth.organizationId,
      provider: "paypal",
      name,
      apiKey: JSON.stringify({ clientId, secret }),
      isActive: true,
    },
  });

  return { success: true };
});

const updateSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().optional().or(z.literal("")),
  secret: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Navn er påkrevd"),
});

export const updatePaypalKey = withAuth(async (auth, formData: unknown) => {
  const { id, clientId, secret, name } = updateSchema.parse(formData);

  const existing = await db.integration.findFirst({
    where: { id, organizationId: auth.organizationId },
  });
  if (!existing) {
    throw new Error("Integrasjon ikke funnet.");
  }

  const data: { name: string; apiKey?: string; isActive?: boolean } = { name };

  if (clientId && secret) {
    const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      throw new Error(
        "Ugyldig PayPal-legitimasjon. Kunne ikke koble til PayPal."
      );
    }
    data.apiKey = JSON.stringify({ clientId, secret });
    data.isActive = true;
  }

  await db.integration.update({ where: { id }, data });

  return { success: true };
});

export const disconnectPaypal = withAuth(
  async (auth, formData: unknown) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(formData);

    const existing = await db.integration.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!existing) {
      throw new Error("Integrasjon ikke funnet.");
    }

    await db.integration.delete({ where: { id } });

    return { success: true };
  }
);
