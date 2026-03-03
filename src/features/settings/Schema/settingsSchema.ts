import { z } from "zod";

export const settingsSchema = z.object({
  orgNr: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{9}$/.test(val),
      "Org.nr må være 9 siffer"
    ),
  businessName: z.string().optional(),
  address: z.string().optional(),
  ekomPrivatePercent: z.coerce
    .number()
    .min(0, "Må være mellom 0 og 100")
    .max(100, "Må være mellom 0 og 100"),
  defaultCurrency: z.enum(["NOK", "EUR", "USD"]),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
