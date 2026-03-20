"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  settingsSchema,
  type SettingsFormData,
} from "../Schema/settingsSchema";
import { updateSettings } from "../Actions/updateSettings";

type Props = {
  defaultValues?: Partial<SettingsFormData>;
};

export function BusinessInfoForm({ defaultValues }: Props) {
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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Bedriftsinformasjon</CardTitle>
        <CardDescription>
          Opplysninger om din enkeltpersonforetak.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
          <CardContent className="flex-1 space-y-4 pb-6">
            <FormField
              control={form.control}
              name="orgNr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisasjonsnummer</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedriftsnavn</FormLabel>
                  <FormControl>
                    <Input placeholder="Mitt Firma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Gateveien 1, 0123 Oslo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard valuta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg valuta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NOK">NOK</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Lagrer..." : "Lagre"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
