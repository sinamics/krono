"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  stripeKeySchema,
  type StripeKeyFormData,
} from "../Schema/integrationSchema";
import { saveStripeKey } from "../Actions/saveStripeKey";

export function AddStripeDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StripeKeyFormData>({
    resolver: zodResolver(stripeKeySchema),
    defaultValues: { name: "", apiKey: "" },
  });

  function onSubmit(data: StripeKeyFormData) {
    setError(null);
    startTransition(async () => {
      try {
        await saveStripeKey(data);
        form.reset();
        setOpen(false);
        window.location.reload();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke koble til Stripe."
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Legg til konto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til Stripe-konto</DialogTitle>
          <DialogDescription>
            Oppgi et navn og din secret API-nokkel fra Stripe.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontonavn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Hovedkonto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret API-nokkel</FormLabel>
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
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Kobler til..." : "Koble til"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
