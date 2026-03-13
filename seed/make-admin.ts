import { PrismaClient } from "../src/generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx seed/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  if (user.role === "super_admin") {
    console.log(`${email} is already super_admin.`);
    process.exit(0);
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: "super_admin" },
  });

  console.log(`${email} is now super_admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
