import mongoose, { ObjectId } from "mongoose";
import { Settings } from "shared/types/models/settings";

export interface SettingsDoc extends Settings, mongoose.Document<ObjectId> {}
