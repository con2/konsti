import mongoose from "mongoose";
import { TestSettings } from "shared/test-typings/models/testSettings";

export interface TestSettingsDoc extends TestSettings, mongoose.Document {}
