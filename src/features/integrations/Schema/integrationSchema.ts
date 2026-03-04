import { z } from "zod";

export const stripeKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, "API-nøkkel er påkrevd")
    .startsWith("sk_", "API-nøkkelen må starte med sk_"),
});

export type StripeKeyFormData = z.infer<typeof stripeKeySchema>;

export const paypalKeySchema = z.object({
  clientId: z.string().min(1, "Client ID er påkrevd"),
  secret: z.string().min(1, "Secret er påkrevd"),
});

export type PaypalKeyFormData = z.infer<typeof paypalKeySchema>;

export const syncParamsSchema = z.object({
  from: z.date(),
  to: z.date(),
});

export type SyncParamsFormData = z.infer<typeof syncParamsSchema>;
