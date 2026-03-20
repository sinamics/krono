"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supplierSchema, type SupplierFormData } from "../Schema/supplierSchema";
import { updateSupplier } from "../Actions/updateSupplier";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  supplier: {
    id: string; name: string; country: string; currency: string;
    type: string; orgNr: string | null; vatId: string | null;
    defaultCategory: string | null;
  };
};

export function EditSupplierForm({ supplier }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier.name,
      country: supplier.country,
      currency: supplier.currency as "NOK" | "EUR" | "USD",
      type: supplier.type as "NORWEGIAN" | "FOREIGN",
      defaultCategory: supplier.defaultCategory ?? "",
      orgNr: supplier.orgNr ?? "",
      vatId: supplier.vatId ?? "",
    },
  });

  const country = form.watch("country");
  const isNorwegian = form.watch("type") === "NORWEGIAN";

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
      await updateSupplier(supplier.id, data);
      router.push("/suppliers");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noe gikk galt";
      form.setError("root", { message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Endre leverandør</CardTitle>
        <CardDescription>
          Oppdater feltene nedenfor og trykk lagre.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
          <CardContent className="flex-1 space-y-4 pb-6">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            {isNorwegian ? (
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
            ) : (
              <FormField
                control={form.control}
                name="vatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EU VAT-ID</FormLabel>
                    <FormControl>
                      <Input placeholder="IE1234567X" {...field} />
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
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Lagrer..." : "Lagre"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
