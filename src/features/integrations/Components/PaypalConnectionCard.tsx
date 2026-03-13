"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { getNextAutoSync } from "@/lib/next-sync";
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
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  paypalKeySchema,
  syncParamsSchema,
  type PaypalKeyFormData,
  type SyncParamsFormData,
} from "../Schema/integrationSchema";
import { savePaypalKey, disconnectPaypal } from "../Actions/savePaypalKey";
import { syncPaypalTransactions } from "../Actions/syncPaypalTransactions";
import type { PaypalIntegration } from "../Actions/getIntegration";

type SyncResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

interface Props {
  integration: PaypalIntegration;
}

export function PaypalConnectionCard({ integration }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSyncTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(integration);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const connectForm = useForm<PaypalKeyFormData>({
    resolver: zodResolver(paypalKeySchema),
    defaultValues: { clientId: "", secret: "" },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const syncForm = useForm<SyncParamsFormData>({
    resolver: zodResolver(syncParamsSchema),
    defaultValues: { from: thirtyDaysAgo, to: new Date() },
  });

  function setRange(months: number) {
    const now = new Date();
    syncForm.setValue("from", subMonths(now, months));
    syncForm.setValue("to", now);
  }

  function setYearRange(year: "this" | "last") {
    const ref = year === "last" ? subYears(new Date(), 1) : new Date();
    syncForm.setValue("from", startOfYear(ref));
    syncForm.setValue("to", year === "last" ? endOfYear(ref) : new Date());
  }

  function onConnect(data: PaypalKeyFormData) {
    setError(null);
    startTransition(async () => {
      try {
        await savePaypalKey(data);
        connectForm.reset();
        window.location.reload();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke koble til PayPal."
        );
      }
    });
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      try {
        await disconnectPaypal();
        setCurrent(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke koble fra PayPal."
        );
      }
    });
  }

  function onSync(data: SyncParamsFormData) {
    setSyncError(null);
    setSyncResult(null);
    startSyncTransition(async () => {
      try {
        const res = await syncPaypalTransactions(data);
        setSyncResult(res);
      } catch (err) {
        setSyncError(
          err instanceof Error ? err.message : "Synkronisering feilet."
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>PayPal</CardTitle>
            <CardDescription>
              Importer salg og gebyrer automatisk fra PayPal.
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Client ID: {current.maskedClientId}
                </p>
                {current.lastSyncAt && (
                  <p className="text-sm text-muted-foreground">
                    Sist synkronisert:{" "}
                    {new Date(current.lastSyncAt).toLocaleString("nb-NO")}
                  </p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  Neste auto-sync:{" "}
                  {getNextAutoSync("paypal").toLocaleDateString("nb-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                {isPending ? "Kobler fra..." : "Koble fra"}
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">Synkroniser transaksjoner</h4>
              <Form {...syncForm}>
                <form onSubmit={syncForm.handleSubmit(onSync)} className="space-y-4">
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
                    <Button type="button" variant="outline" size="sm" onClick={() => setRange(12)}>
                      12 mnd
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setYearRange("this")}>
                      I år
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setYearRange("last")}>
                      I fjor
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <FormField
                      control={syncForm.control}
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
                      control={syncForm.control}
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

                  <Button type="submit" disabled={isSyncing}>
                    {isSyncing ? "Synkroniserer..." : "Synkroniser"}
                  </Button>
                </form>
              </Form>

              {syncError && <p className="mt-4 text-sm text-destructive">{syncError}</p>}

              {syncResult && (
                <div className="mt-4 flex gap-2">
                  <Badge variant="default">{syncResult.imported} importert</Badge>
                  <Badge variant="secondary">{syncResult.skipped} hoppet over</Badge>
                  {syncResult.errors.length > 0 && (
                    <Badge variant="destructive">
                      {syncResult.errors.length} feil
                    </Badge>
                  )}
                </div>
              )}

              {syncResult && syncResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {syncResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Form {...connectForm}>
            <form onSubmit={connectForm.handleSubmit(onConnect)} className="space-y-4">
              <FormField
                control={connectForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Client ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={connectForm.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Secret"
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
