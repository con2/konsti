import dayjs from "dayjs";
import mongoose from "mongoose";
import { z } from "zod";

export const TestSettingsSchemaDb = z
  .object({
    testTime: z
      .date()
      .nullable()
      .transform((date) => (date ? dayjs(date).toISOString() : date)),
  })
  .strip();

type TestSettingsDb = z.infer<typeof TestSettingsSchemaDb>;

const testSettingsSchema = new mongoose.Schema<TestSettingsDb>(
  {
    // @ts-expect-error -- Zod type takes date but returns string
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
