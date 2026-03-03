import { z } from "zod";

export const mvaTermSchema = z.object({
  year: z.number().min(2020, "År må være 2020 eller nyere"),
  term: z.number().min(1, "Termin må være 1-6").max(6, "Termin må være 1-6"),
});

export type MvaTermInput = z.infer<typeof mvaTermSchema>;
