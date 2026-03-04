"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  stripeKeySchema,
  type StripeKeyFormData,
} from "../Schema/integrationSchema";
import { saveStripeKey, disconnectStripe } from "../Actions/saveStripeKey";
import type { StripeIntegration } from "../Actions/getIntegration";

interface Props {
  integration: StripeIntegration;
}

export function StripeConnectionCard({ integration }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(integration);

  const form = useForm<StripeKeyFormData>({
    resolver: zodResolver(stripeKeySchema),
    defaultValues: { apiKey: "" },
  });

  function onSubmit(data: StripeKeyFormData) {
    setError(null);
    startTransition(async () => {
      try {
        await saveStripeKey(data);
        form.reset();
        window.location.reload();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke koble til Stripe."
        );
      }
    });
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      try {
        await disconnectStripe();
        setCurrent(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke koble fra Stripe."
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>
              Koble til Stripe for å importere salg og gebyrer automatisk.
            </CardDescription>
          </div>
          {current?.isActive ? (
            <Badge variant="default">Tilkoblet</Badge>
          ) : (
            <Badge variant="secondary">Ikke tilkoblet</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {current?.isActive ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nøkkel: {current.maskedKey}
            </p>
            {current.lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                Sist synkronisert:{" "}
                {new Date(current.lastSyncAt).toLocaleString("nb-NO")}
              </p>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              {isPending ? "Kobler fra..." : "Koble fra"}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret API-nøkkel</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="sk_live_..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kobler til..." : "Koble til"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
