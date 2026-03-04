"use client";

import { useState } from "react";
import type { supplier } from "@/generated/db/client";
import type { FormProps } from "./TransactionFormFields";
import { InlineSupplierDialog } from "./InlineSupplierDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ExpenseFields({
  form,
  suppliers: externalSuppliers,
  onSupplierCreated,
}: FormProps & { suppliers: supplier[]; onSupplierCreated?: (s: supplier) => void }) {
  const [localSuppliers, setLocalSuppliers] = useState<supplier[]>([]);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const supplierId = form.watch("supplierId");

  // Merge external list with any locally-created suppliers
  const suppliers = [
    ...externalSuppliers,
    ...localSuppliers.filter((ls) => !externalSuppliers.some((es) => es.id === ls.id)),
  ];

  const handleSupplierCreated = (newSupplier: supplier) => {
    setLocalSuppliers((prev) => [...prev, newSupplier]);
    form.setValue("supplierId", newSupplier.id);
    onSupplierCreated?.(newSupplier);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="supplierId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Leverandør</FormLabel>
            <div className="flex gap-2">
              <Select
                value={field.value ?? "NONE"}
                onValueChange={(v) =>
                  field.onChange(v === "NONE" ? undefined : v)
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg leverandør" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NONE">Ingen leverandør</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSupplierDialog(true)}
                title="Ny leverandør"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {!supplierId && (
        <FormField
          control={form.control}
          name="supplierType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leverandørtype</FormLabel>
              <Select
                value={field.value ?? "NORWEGIAN"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NORWEGIAN">Norsk</SelectItem>
                  <SelectItem value="FOREIGN">Utenlandsk</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <InlineSupplierDialog
        open={showSupplierDialog}
        onOpenChange={setShowSupplierDialog}
        onCreated={handleSupplierCreated}
      />
    </>
  );
}

export function OptionalFields({ form }: FormProps) {
  const isRecurring = form.watch("isRecurring");
  return (
    <>
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kategori (valgfritt)</FormLabel>
            <Select
              value={field.value || "NONE"}
              onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">Ingen kategori</SelectItem>
                <SelectItem value="Internet">Internet (EKOM)</SelectItem>
                <SelectItem value="Telefon">Telefon (EKOM)</SelectItem>
                <SelectItem value="Hosting">Hosting/Server</SelectItem>
                <SelectItem value="Abonnement">Abonnement/SaaS</SelectItem>
                <SelectItem value="Kontor">Kontor</SelectItem>
                <SelectItem value="Reise">Reise</SelectItem>
                <SelectItem value="Mat">Mat</SelectItem>
                <SelectItem value="Programvare">Programvare</SelectItem>
                <SelectItem value="Utstyr">Utstyr</SelectItem>
                <SelectItem value="Forsikring">Forsikring</SelectItem>
                <SelectItem value="Regnskap">Regnskap</SelectItem>
                <SelectItem value="Markedsføring">Markedsføring</SelectItem>
                <SelectItem value="Annet">Annet</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notater (valgfritt)</FormLabel>
            <FormControl>
              <Input placeholder="Ekstra informasjon" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center gap-4">
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border"
                />
              </FormControl>
              <FormLabel className="!mt-0">Gjentakende</FormLabel>
            </FormItem>
          )}
        />
        {isRecurring && (
          <FormField
            control={form.control}
            name="recurringDay"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Dag i måneden"
                    className="w-[140px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </>
  );
}
