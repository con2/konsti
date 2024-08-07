import { z } from "zod";

export const PopulateDbOptionsSchema = z.object({
  clean: z.boolean().optional(),
  users: z.boolean().optional(),
  programItems: z.boolean().optional(),
  lotterySignups: z.boolean().optional(),
  directSignups: z.boolean().optional(),
  eventLog: z.boolean().optional(),
});

export type PopulateDbOptions = z.infer<typeof PopulateDbOptionsSchema>;
