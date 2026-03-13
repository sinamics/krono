import { connection } from "next/server";
import { db } from "@/lib/db";
import { LoginForm } from "@/features/auth/Components/LoginForm";

export default async function SignInPage() {
  await connection();
  const regSetting = await db.appSettings.findUnique({
    where: { key: "registration_enabled" },
  });

  const registrationEnabled = regSetting?.value !== "false";

  return <LoginForm registrationEnabled={registrationEnabled} />;
}
