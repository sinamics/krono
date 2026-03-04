"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";

export async function getStripeIntegration() {
  const session = await getSession();
  if (!session) return null;

  const integration = await db.integration.findUnique({
    where: {
      userId_provider: {
        userId: session.userId,
        provider: "stripe",
      },
    },
  });

  if (!integration) return null;

  return {
    id: integration.id,
    isActive: integration.isActive,
    lastSyncAt: integration.lastSyncAt,
    createdAt: integration.createdAt,
    maskedKey: `${integration.apiKey.slice(0, 7)}...${integration.apiKey.slice(-4)}`,
  };
}

export type StripeIntegration = Awaited<ReturnType<typeof getStripeIntegration>>;

export async function getPaypalIntegration() {
  const session = await getSession();
  if (!session) return null;

  const integration = await db.integration.findUnique({
    where: {
      userId_provider: {
        userId: session.userId,
        provider: "paypal",
      },
    },
  });

  if (!integration) return null;

  let maskedClientId = "***";
  try {
    const parsed = JSON.parse(integration.apiKey);
    const cid = parsed.clientId as string;
    maskedClientId = `${cid.slice(0, 7)}...${cid.slice(-4)}`;
  } catch {
    // fallback
  }

  return {
    id: integration.id,
    isActive: integration.isActive,
    lastSyncAt: integration.lastSyncAt,
    createdAt: integration.createdAt,
    maskedClientId,
  };
}

export type PaypalIntegration = Awaited<ReturnType<typeof getPaypalIntegration>>;
