import { db } from "@/lib/db";

export async function getSettings(organizationId: string) {
  const settings = await db.businessSettings.findUnique({
    where: { organizationId },
  });

  return settings;
}
