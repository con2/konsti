import { z } from "zod";

export const TestSettingsSchema = z.object({
  // An unparseable time here becomes an Invalid Date that every formatter then
  // throws on, so it is rejected at the boundary like every other malformed time
  testTime: z.iso.datetime().nullable(),
});

export type TestSettings = z.infer<typeof TestSettingsSchema>;
