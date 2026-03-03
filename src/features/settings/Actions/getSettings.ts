import { db } from "@/lib/db";

export async function getSettings(userId: string) {
  const settings = await db.businessSettings.findUnique({
    where: { userId },
  });

  return settings;
}
