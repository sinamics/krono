import { connection } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RegisterForm } from "@/features/auth/Components/RegisterForm";

export default async function SignUpPage() {
  await connection();
  const regSetting = await db.appSettings.findUnique({
    where: { key: "registration_enabled" },
  });

  if (regSetting?.value === "false") {
    redirect("/sign-in");
  }

  return <RegisterForm />;
}
