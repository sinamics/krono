"use server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string().min(1, "Integrasjon-ID er påkrevd"),
});

export const deleteIntegration = withAuth(
  async (auth, formData: unknown) => {
    const { id } = deleteSchema.parse(formData);

    const integration = await db.integration.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    });

    if (!integration) {
      throw new Error("Integrasjon ikke funnet.");
    }

    await db.integration.delete({ where: { id } });

    return { success: true };
  }
);
