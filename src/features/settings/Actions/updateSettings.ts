"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import type { SettingsFormData } from "../Schema/settingsSchema";

export const updateSettings = withAuth(
  async (auth, data: SettingsFormData) => {
    const settings = await db.businessSettings.upsert({
      where: { organizationId: auth.organizationId },
      create: {
        organizationId: auth.organizationId,
        orgNr: data.orgNr ?? null,
        businessName: data.businessName ?? null,
        address: data.address ?? null,
        ekomPrivatePercent: data.ekomPrivatePercent,
        defaultCurrency: data.defaultCurrency,
      },
      update: {
        orgNr: data.orgNr ?? null,
        businessName: data.businessName ?? null,
        address: data.address ?? null,
        ekomPrivatePercent: data.ekomPrivatePercent,
        defaultCurrency: data.defaultCurrency,
      },
    });

    return settings;
  }
);
