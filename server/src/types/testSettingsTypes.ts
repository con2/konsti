import mongoose, { ObjectId } from "mongoose";
import { TestSettings } from "shared/test-types/models/testSettings";

export interface TestSettingsDoc
  extends TestSettings,
    mongoose.Document<ObjectId> {}
