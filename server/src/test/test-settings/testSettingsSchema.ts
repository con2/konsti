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

const testSettingsSchema = new mongoose.Schema(
  {
    testTime: {
      type: Date,
      get: (value: Date | null) => (value ? new Date(value) : value),
      default: () => null,
    },
  },
  { timestamps: true },
);

export const TestSettingsModel = mongoose.model(
  "test-settings",
  testSettingsSchema,
);
