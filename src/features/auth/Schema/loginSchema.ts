import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(1, "Passord er påkrevd"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
