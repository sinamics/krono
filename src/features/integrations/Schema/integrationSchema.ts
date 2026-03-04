import { z } from "zod";

export const stripeKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, "API-nøkkel er påkrevd")
    .startsWith("sk_", "API-nøkkelen må starte med sk_"),
});

export type StripeKeyFormData = z.infer<typeof stripeKeySchema>;

export const syncParamsSchema = z.object({
  from: z.date(),
  to: z.date(),
});

export type SyncParamsFormData = z.infer<typeof syncParamsSchema>;
