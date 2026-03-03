import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  country: z.string().min(1, "Land er påkrevd"),
  currency: z.enum(["NOK", "EUR", "USD"], {
    message: "Velg valuta",
  }),
  type: z.enum(["NORWEGIAN", "FOREIGN"]),
  defaultMvaCode: z.string().optional(),
  defaultCategory: z.string().optional(),
  orgNr: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{9}$/.test(val),
      "Org.nr må være 9 siffer"
    ),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
