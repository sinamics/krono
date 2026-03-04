"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  syncParamsSchema,
  type SyncParamsFormData,
} from "../Schema/integrationSchema";
import { syncStripeTransactions } from "../Actions/syncStripeTransactions";

type SyncResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export function StripeSyncCard() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const form = useForm<SyncParamsFormData>({
    resolver: zodResolver(syncParamsSchema),
    defaultValues: {
      from: thirtyDaysAgo,
      to: new Date(),
    },
  });

  function setRange(months: number) {
    const now = new Date();
    form.setValue("from", subMonths(now, months));
    form.setValue("to", now);
  }

  function onSubmit(data: SyncParamsFormData) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncStripeTransactions(data);
        setResult(res);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Synkronisering feilet."
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synkroniser transaksjoner</CardTitle>
        <CardDescription>
          Importer salg og Stripe-gebyrer for en valgt periode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRange(2)}>
                2 mnd
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setRange(3)}>
                3 mnd
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setRange(6)}>
                6 mnd
              </Button>
            </div>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Fra</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP", { locale: nb })
                              : "Velg dato"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={nb}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Til</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP", { locale: nb })
                              : "Velg dato"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={nb}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Synkroniserer..." : "Synkroniser"}
            </Button>
          </form>
        </Form>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {result && (
          <div className="mt-4 flex gap-2">
            <Badge variant="default">{result.imported} importert</Badge>
            <Badge variant="secondary">{result.skipped} hoppet over</Badge>
            {result.errors.length > 0 && (
              <Badge variant="destructive">
                {result.errors.length} feil
              </Badge>
            )}
          </div>
        )}

        {result && result.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {result.errors.map((err, i) => (
              <p key={i} className="text-xs text-destructive">
                {err}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
