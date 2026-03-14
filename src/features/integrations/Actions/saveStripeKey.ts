"use server";

import Stripe from "stripe";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { stripeKeySchema } from "../Schema/integrationSchema";

export const saveStripeKey = withAuth(async (auth, formData: unknown) => {
  const { apiKey } = stripeKeySchema.parse(formData);

  const stripe = new Stripe(apiKey);
  try {
    await stripe.balance.retrieve();
  } catch {
    throw new Error("Ugyldig API-nøkkel. Kunne ikke koble til Stripe.");
  }

  await db.integration.upsert({
    where: {
      organizationId_provider: {
        organizationId: auth.organizationId,
        provider: "stripe",
      },
    },
    create: {
      organizationId: auth.organizationId,
      provider: "stripe",
      apiKey,
      isActive: true,
    },
    update: {
      apiKey,
      isActive: true,
    },
  });

  return { success: true };
});

export const disconnectStripe = withAuth(async (auth) => {
  await db.integration.deleteMany({
    where: {
      organizationId: auth.organizationId,
      provider: "stripe",
    },
  });

  return { success: true };
});
