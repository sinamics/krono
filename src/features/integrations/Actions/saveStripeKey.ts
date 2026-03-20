"use server";

import Stripe from "stripe";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { stripeKeySchema } from "../Schema/integrationSchema";
import { z } from "zod";

export const saveStripeKey = withAuth(async (auth, formData: unknown) => {
  const { apiKey, name } = stripeKeySchema.parse(formData);

  const stripe = new Stripe(apiKey);
  try {
    await stripe.balance.retrieve();
  } catch {
    throw new Error("Ugyldig API-nøkkel. Kunne ikke koble til Stripe.");
  }

  await db.integration.create({
    data: {
      organizationId: auth.organizationId,
      provider: "stripe",
      name,
      apiKey,
      isActive: true,
    },
  });

  return { success: true };
});

const updateSchema = z.object({
  id: z.string().min(1),
  apiKey: z
    .string()
    .startsWith("sk_", "API-nøkkelen må starte med sk_")
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, "Navn er påkrevd"),
});

export const updateStripeKey = withAuth(async (auth, formData: unknown) => {
  const { id, apiKey, name } = updateSchema.parse(formData);

  const existing = await db.integration.findFirst({
    where: { id, organizationId: auth.organizationId },
  });
  if (!existing) {
    throw new Error("Integrasjon ikke funnet.");
  }

  const data: { name: string; apiKey?: string; isActive?: boolean } = { name };

  if (apiKey) {
    const stripe = new Stripe(apiKey);
    try {
      await stripe.balance.retrieve();
    } catch {
      throw new Error("Ugyldig API-nøkkel. Kunne ikke koble til Stripe.");
    }
    data.apiKey = apiKey;
    data.isActive = true;
  }

  await db.integration.update({ where: { id }, data });

  return { success: true };
});

export const disconnectStripe = withAuth(
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
