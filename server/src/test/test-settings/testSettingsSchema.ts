import mongoose from "mongoose";
import { TestSettings } from "shared/test-types/models/testSettings";

const TestSettingsSchema = new mongoose.Schema(
  {
    testTime: { type: Date, default: null },
  },
  { timestamps: true },
);

interface TestSettingsDoc extends TestSettings, mongoose.Document {}

export const TestSettingsModel = mongoose.model<TestSettingsDoc>(
  "test-settings",
  TestSettingsSchema,
);
