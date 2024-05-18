import mongoose, { ObjectId } from "mongoose";
import { TestSettings } from "shared/test-types/models/testSettings";

interface TestSettingsDoc extends TestSettings, mongoose.Document<ObjectId> {}

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
