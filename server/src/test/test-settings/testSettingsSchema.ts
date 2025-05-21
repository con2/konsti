import mongoose from "mongoose";
import { z } from "zod";

export const TestSettingsSchemaDb = z
  .object({
    testTime: z.date().nullable(),
  })
  .strip();

type TestSettingsDb = z.infer<typeof TestSettingsSchemaDb>;

const testSettingsSchema = new mongoose.Schema<TestSettingsDb>(
  {
    testTime: {
      type: Date,
      get: (value: Date | null) => (value ? new Date(value) : value),
      default: () => null,
    },
  },
  { timestamps: true },
);

export const TestSettingsModel = mongoose.model<TestSettingsDb>(
  "test-settings",
  testSettingsSchema,
);
