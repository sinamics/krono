"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { settingsSchema, type SettingsFormData } from "../Schema/settingsSchema";
import { updateSettings } from "../Actions/updateSettings";

type Props = {
  defaultValues?: Partial<SettingsFormData>;
};

export function EkomSettingsForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormData>,
    defaultValues: {
      orgNr: defaultValues?.orgNr ?? "",
      businessName: defaultValues?.businessName ?? "",
      address: defaultValues?.address ?? "",
      ekomPrivatePercent: defaultValues?.ekomPrivatePercent ?? 0,
      defaultCurrency: defaultValues?.defaultCurrency ?? "NOK",
    },
  });

  function onSubmit(data: SettingsFormData) {
    startTransition(async () => {
      await updateSettings(data);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EKOM-innstillinger</CardTitle>
        <CardDescription>
          Innstillinger for elektronisk kommunikasjon (telefon, internett).
          Sjablongbeløpet for privat bruk er 4 392 kr/år (366 kr/mnd).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ekomPrivatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privatandel (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Andel av EKOM-kostnader som er privat bruk (0-100%).
                    Sett til 0 dersom du ikke har privatandel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
              <p className="font-medium">Om EKOM-fradrag</p>
              <p className="text-muted-foreground">
                Hvis du bruker telefon/internett både privat og i næring,
                kan du trekke fra bedriftens andel av kostnadene.
                Privatandelen beregnes etter sjablongmetoden
                (maks 4 392 kr/år).
              </p>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Lagrer..." : "Lagre"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
