import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(8, "Passord må være minst 8 tegn"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
