import mongoose from "mongoose";
import { TestSettings } from "shared/test-types/models/testSettings";

interface TestSettingsDoc extends TestSettings, mongoose.Document {}

const TestSettingsSchema = new mongoose.Schema(
  {
    testTime: { type: Date, default: null },
  },
  { timestamps: true },
);

export const TestSettingsModel = mongoose.model<TestSettingsDoc>(
  "test-settings",
  TestSettingsSchema,
);
