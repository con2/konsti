import mongoose from "mongoose";
import { Settings } from "shared/typings/models/settings";

export interface SettingsDoc extends Settings, mongoose.Document {}
