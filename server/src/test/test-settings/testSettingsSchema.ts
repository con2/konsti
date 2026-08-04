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

// Single test settings document, keyed like the real settings so concurrent
// upserts can't insert a second one that shadows the first
export const TEST_SETTINGS_SINGLETON_KEY = 0;

const testSettingsSchema = new mongoose.Schema(
  {
    singleton: {
      type: Number,
      default: TEST_SETTINGS_SINGLETON_KEY,
      unique: true,
    },
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
