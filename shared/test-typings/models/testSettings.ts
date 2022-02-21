import { z } from "zod";

export const TestSettingsSchema = z.object({
  testTime: z.string(),
});

export type TestSettings = z.infer<typeof TestSettingsSchema>;
