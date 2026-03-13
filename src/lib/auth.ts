import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    async onUserCreated(user: { user: { id: string; name: string; email: string } }) {
      // Check if registration is disabled
      const regSetting = await db.appSettings.findUnique({
        where: { key: "registration_enabled" },
      });
      // Count existing users to see if this is the first
      const userCount = await db.user.count();

      const isFirstUser = userCount <= 1; // This user is the only one

      if (!isFirstUser && regSetting?.value === "false") {
        // Registration disabled — delete the user that was just created
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
          name: user.user.name ? `${user.user.name}` : "Min bedrift",
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
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
