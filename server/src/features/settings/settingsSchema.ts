import mongoose from "mongoose";
import { config } from "shared/config";
import { Settings } from "shared/types/models/settings";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenProgramItemIds: [String],
    appOpen: { type: Boolean, default: true },
    signupQuestions: [
      {
        programItemId: { type: String },
        questionFi: { type: String },
        questionEn: { type: String },
        private: { type: Boolean },
        type: { type: String },
        selectOptions: [
          {
            optionFi: { type: String },
            optionEn: { type: String },
          },
        ],
      },
    ],
    signupStrategy: {
      type: String,
      default: config.server().defaultSignupStrategy,
    },
    programUpdateLastRun: { type: Date, default: Date.now },
    assignmentLastRun: { type: Date, default: Date.now },
    latestServerStartTime: { type: Date, default: Date.now },
    loginProvider: {
      type: String,
      default: config.server().defaultLoginProvider,
    },
  },
  { timestamps: true },
);

interface SettingsDoc extends Settings, mongoose.Document {}

export const SettingsModel = mongoose.model<SettingsDoc>(
  "settings",
  SettingsSchema,
);
