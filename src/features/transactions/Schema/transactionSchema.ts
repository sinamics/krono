import { z } from "zod";

export const transactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Beskrivelse er påkrevd"),
  amount: z.coerce.number().positive("Beløp må være positivt"),
  currency: z.enum(["NOK", "EUR", "USD"]),
  exchangeRate: z.coerce.number().positive("Kurs må være positiv").default(1),
  type: z.enum(["SALE", "EXPENSE"]),
  supplierType: z.enum(["NORWEGIAN", "FOREIGN"]).optional(),
  supplierId: z.string().optional(),
  category: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringDay: z.coerce.number().int().min(1).max(31).optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
