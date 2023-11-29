import mongoose from "mongoose";
import { TestSettings } from "shared/test-types/models/testSettings";

export interface TestSettingsDoc extends TestSettings, mongoose.Document {}
