"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  supplierSchema,
  type SupplierFormData,
} from "@/features/suppliers/Schema/supplierSchema";
import { createSupplier } from "@/features/suppliers/Actions/createSupplier";
import type { supplier } from "@/generated/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (supplier: supplier) => void;
};

export function InlineSupplierDialog({ open, onOpenChange, onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      country: "Norge",
      currency: "NOK",
      type: "NORWEGIAN",
      defaultCategory: "",
      orgNr: "",
    },
  });

  const country = form.watch("country");

  useEffect(() => {
    const type = country === "Norge" ? "NORWEGIAN" : "FOREIGN";
    form.setValue("type", type);
    if (type === "FOREIGN") {
      form.setValue("orgNr", "");
    }
  }, [country, form]);

  const isNorwegian = form.watch("type") === "NORWEGIAN";

  async function onSubmit(data: SupplierFormData) {
    setLoading(true);
    try {
      const newSupplier = await createSupplier(data);
      form.reset();
      onCreated(newSupplier);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Noe gikk galt";
      form.setError("root", { message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny leverandør</DialogTitle>
          <DialogDescription>
            Opprett en ny leverandør raskt fra transaksjonsskjemaet.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Leverandørnavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <FormControl>
                      <Input placeholder="Norge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
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
            </div>
            {isNorwegian && (
              <FormField
                control={form.control}
                name="orgNr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Org.nr</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Oppretter..." : "Opprett leverandør"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
