import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    async onUserCreated(user: { user: { id: string; name: string; email: string } }) {
      try {
        // Check if registration is disabled
        let regDisabled = false;
        try {
          const regSetting = await db.appSettings.findUnique({
            where: { key: "registration_enabled" },
          });
          regDisabled = regSetting?.value === "false";
        } catch {
          // appSettings table may not exist yet — allow registration
        }

        const userCount = await db.user.count();
        const isFirstUser = userCount <= 1;

        if (!isFirstUser && regDisabled) {
          await db.user.delete({ where: { id: user.user.id } });
          throw new Error("Registrering er deaktivert.");
        }

        // Make first user super_admin
        if (isFirstUser) {
          await db.user.update({
            where: { id: user.user.id },
            data: { role: "super_admin" },
          });
        }

        // Create a default organization for the user
        const org = await db.organization.create({
          data: {
            name: user.user.name || "Min bedrift",
          },
        });

        await db.organizationMember.create({
          data: {
            organizationId: org.id,
            userId: user.user.id,
            role: "owner",
          },
        });

        // Initialize registration_enabled setting if first user
        if (isFirstUser) {
          await db.appSettings.upsert({
            where: { key: "registration_enabled" },
            update: {},
            create: { key: "registration_enabled", value: "true" },
          });
        }
      } catch (err) {
        console.error("[auth] onUserCreated failed:", err);
        throw err;
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    passkey({
      rpID: new URL(baseURL).hostname,
      rpName: "Krono",
      origin: baseURL,
    }),
  ],
});
