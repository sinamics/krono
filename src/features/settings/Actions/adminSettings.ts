"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";

export async function getAdminSettings() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Ingen tilgang.");
  }

  const regSetting = await db.appSettings.findUnique({
    where: { key: "registration_enabled" },
  });

  return {
    registrationEnabled: regSetting?.value !== "false",
  };
}

export async function updateAdminSettings(data: {
  registrationEnabled: boolean;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Ingen tilgang.");
  }

  await db.appSettings.upsert({
    where: { key: "registration_enabled" },
    update: { value: data.registrationEnabled ? "true" : "false" },
    create: { key: "registration_enabled", value: data.registrationEnabled ? "true" : "false" },
  });

  return { success: true };
}
