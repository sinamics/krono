import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "@/features/landing/Components/Hero";
import { Features } from "@/features/landing/Components/Features";
import { getSession } from "@/lib/withAuth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">Krono</h1>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Logg inn</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Opprett konto</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Hero />
        <Features />
      </main>
    </div>
  );
}
