"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";

function maskApiKey(apiKey: string): string {
  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

function maskPaypalKey(apiKey: string): string {
  try {
    const parsed = JSON.parse(apiKey);
    const cid = parsed.clientId as string;
    return `${cid.slice(0, 7)}...${cid.slice(-4)}`;
  } catch {
    return "***";
  }
}

export async function getIntegrations(provider: "stripe" | "paypal") {
  const session = await getSession();
  if (!session) return [];

  const integrations = await db.integration.findMany({
    where: {
      organizationId: session.organizationId,
      provider,
    },
    orderBy: { createdAt: "asc" },
  });

  return integrations.map((integration) => ({
    id: integration.id,
    name: integration.name,
    provider: integration.provider,
    isActive: integration.isActive,
    lastSyncAt: integration.lastSyncAt,
    createdAt: integration.createdAt,
    maskedKey:
      provider === "paypal"
        ? maskPaypalKey(integration.apiKey)
        : maskApiKey(integration.apiKey),
  }));
}

export type IntegrationItem = Awaited<
  ReturnType<typeof getIntegrations>
>[number];

/** Backward-compatible: returns the first integration for a provider */
export async function getStripeIntegration() {
  const integrations = await getIntegrations("stripe");
  return integrations[0] ?? null;
}

export type StripeIntegration = Awaited<
  ReturnType<typeof getStripeIntegration>
>;

/** Backward-compatible: returns the first integration for PayPal */
export async function getPaypalIntegration() {
  const integrations = await getIntegrations("paypal");
  return integrations[0] ?? null;
}

export type PaypalIntegration = Awaited<
  ReturnType<typeof getPaypalIntegration>
>;
