"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { transaction, supplier } from "@/generated/db/client";
import {
  transactionSchema,
  type TransactionFormValues,
} from "../Schema/transactionSchema";
import { createTransaction } from "../Actions/createTransaction";
import { updateTransaction } from "../Actions/updateTransaction";
import { createSupplier } from "@/features/suppliers/Actions/createSupplier";
import { AmountFields, DateField, TypeField } from "./TransactionFormFields";
import { ExpenseFields, OptionalFields } from "./TransactionFormExtra";
import { ReceiptUpload, type ParsedReceipt } from "./ReceiptUpload";
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

type Props = {
  suppliers: supplier[];
  transaction?: transaction;
  onSuccess?: () => void;
};

export function TransactionForm({
  suppliers,
  transaction: tx,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suppliersList, setSuppliersList] = useState(suppliers);
  const [pendingSupplier, setPendingSupplier] = useState<{ name: string; currency: string } | null>(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const isEditing = !!tx;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
    defaultValues: {
      date: tx ? new Date(tx.date) : new Date(),
      description: tx?.description ?? "",
      amount: tx?.amount ?? 0,
      currency: (tx?.currency as "NOK" | "EUR" | "USD") ?? "NOK",
      exchangeRate: tx?.exchangeRate ?? 1,
      type: (tx?.type as "SALE" | "EXPENSE") ?? "EXPENSE",
      supplierType: undefined,
      supplierId: tx?.supplierId ?? undefined,
      category: tx?.category ?? "",
      isRecurring: tx?.isRecurring ?? false,
      recurringDay: tx?.recurringDay ?? undefined,
      notes: tx?.notes ?? "",
      receiptUrl: tx?.receiptUrl ?? undefined,
    },
  });

  const watchType = form.watch("type");

  const handleParsedReceipt = (data: ParsedReceipt) => {
    if (data.description) form.setValue("description", data.description);
    if (data.amount) form.setValue("amount", data.amount);
    if (data.currency) form.setValue("currency", data.currency);
    if (data.date) form.setValue("date", new Date(data.date));
    if (data.category) form.setValue("category", data.category);
    if (data.supplierName) {
      const match = suppliersList.find(
        (s) => s.name.toLowerCase() === data.supplierName!.toLowerCase()
      );
      if (match) {
        form.setValue("supplierId", match.id);
      } else {
        setPendingSupplier({
          name: data.supplierName,
          currency: data.currency ?? "NOK",
        });
      }
    }
  };

  const handleCreateSupplier = async () => {
    if (!pendingSupplier) return;
    setCreatingSupplier(true);
    try {
      const isNorwegian = pendingSupplier.currency === "NOK";
      const newSupplier = await createSupplier({
        name: pendingSupplier.name,
        country: isNorwegian ? "Norge" : "",
        currency: pendingSupplier.currency as "NOK" | "EUR" | "USD",
        type: isNorwegian ? "NORWEGIAN" : "FOREIGN",
      });
      setSuppliersList((prev) => [...prev, newSupplier]);
      form.setValue("supplierId", newSupplier.id);
      setPendingSupplier(null);
    } catch {
      // Let user create manually via the + button
      setPendingSupplier(null);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const onSubmit = (values: TransactionFormValues) => {
    startTransition(async () => {
      if (isEditing && tx) {
        await updateTransaction(tx.id, values);
        router.push("/transactions");
      } else {
        await createTransaction(values);
        onSuccess?.();
      }
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TypeField form={form} />
          <DateField form={form} />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Input placeholder="Beskrivelse av transaksjon" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <AmountFields form={form} />
        {watchType === "EXPENSE" && (
          <ExpenseFields
            form={form}
            suppliers={suppliersList}
            onSupplierCreated={(s) => setSuppliersList((prev) => [...prev, s])}
          />
        )}
        <OptionalFields form={form} />
        <ReceiptUpload
          value={form.watch("receiptUrl")}
          onChange={(url) => form.setValue("receiptUrl", url)}
          onParsed={handleParsedReceipt}
        />
        {pendingSupplier && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="flex-1 text-sm">
              Leverandøren <strong>{pendingSupplier.name}</strong> finnes ikke.
              Vil du opprette den?
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPendingSupplier(null)}
              disabled={creatingSupplier}
            >
              Nei
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSupplier}
              disabled={creatingSupplier}
            >
              {creatingSupplier ? "Oppretter..." : "Opprett"}
            </Button>
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? "Lagrer..."
            : isEditing
              ? "Oppdater transaksjon"
              : "Opprett transaksjon"}
        </Button>
      </form>
    </Form>
  );
}
