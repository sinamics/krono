"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signIn } from "@/lib/auth-client";
import {
  registerSchema,
  type RegisterFormValues,
} from "../Schema/registerSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    setLoading(true);

    try {
      const result = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        const msg = result.error.message ?? "";
        if (msg.includes("deaktivert")) {
          setError("Registrering er deaktivert av administrator.");
        } else if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
          setError("En bruker med denne e-posten finnes allerede.");
        } else {
          setError(msg || "Registrering feilet. Prøv igjen.");
        }
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const loginResult = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (loginResult.error) {
        // Registration succeeded but login failed — redirect to sign-in
        router.push("/sign-in");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[register]", err);
      setError("Kunne ikke koble til serveren. Sjekk at databasen er satt opp.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <img src="/images/logo/krono_logo.png" alt="Krono" className="mx-auto size-12 mb-3" />
        <h1 className="text-xl font-bold tracking-tight">Krono</h1>
        <p className="text-sm text-muted-foreground">MVA-regnskap for ENK</p>
      </div>
      <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Opprett konto</CardTitle>
        <CardDescription>
          Fyll ut skjemaet for å opprette en ny konto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ola Nordmann"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="din@epost.no"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passord</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Oppretter konto…" : "Opprett konto"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Har du allerede en konto?{" "}
          <Link href="/sign-in" className="text-primary underline">
            Logg inn
          </Link>
        </p>
      </CardFooter>
    </Card>
    </>
  );
}
