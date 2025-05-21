import { z } from "zod";

export const TestSettingsSchema = z.object({
  testTime: z.string().nullable(),
});

export type TestSettings = z.infer<typeof TestSettingsSchema>;
