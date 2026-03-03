"use client";

import { useTransition } from "react";
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
import { AmountFields, DateField, TypeField } from "./TransactionFormFields";
import { ExpenseFields, OptionalFields } from "./TransactionFormExtra";
import { ReceiptUpload } from "./ReceiptUpload";
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
          <ExpenseFields form={form} suppliers={suppliers} />
        )}
        <OptionalFields form={form} />
        <ReceiptUpload
          value={form.watch("receiptUrl")}
          onChange={(url) => form.setValue("receiptUrl", url)}
        />

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
