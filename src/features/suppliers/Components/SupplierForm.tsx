"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supplierSchema, type SupplierFormData } from "../Schema/supplierSchema";
import { createSupplier } from "../Actions/createSupplier";
import { updateSupplier } from "../Actions/updateSupplier";
import type { SupplierWithCount } from "../Actions/getSuppliers";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Props = {
  supplier?: SupplierWithCount;
  onSuccess?: () => void;
};

export function SupplierForm({ supplier, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!supplier;

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      country: supplier?.country ?? "Norge",
      currency: (supplier?.currency as "NOK" | "EUR" | "USD") ?? "NOK",
      type: (supplier?.type as "NORWEGIAN" | "FOREIGN") ?? "NORWEGIAN",
      defaultCategory: supplier?.defaultCategory ?? "",
      orgNr: supplier?.orgNr ?? "",
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

  async function onSubmit(data: SupplierFormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateSupplier(supplier.id, data);
      } else {
        await createSupplier(data);
      }
      router.refresh();
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Noe gikk galt";
      form.setError("root", { message });
    } finally {
      setLoading(false);
    }
  }

  const isNorwegian = form.watch("type") === "NORWEGIAN";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Rediger leverandør" : "Ny leverandør"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Oppdater leverandørinformasjon"
            : "Legg til en ny leverandør"}
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
          <FormField
            control={form.control}
            name="defaultCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standardkategori</FormLabel>
                <FormControl>
                  <Input placeholder="Valgfri" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Lagrer..."
              : isEdit
                ? "Oppdater"
                : "Opprett"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}
