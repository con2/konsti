import mongoose from "mongoose";
import { SettingsDoc } from "server/typings/settings.typings";
import { sharedConfig } from "shared/config/sharedConfig";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Game", default: [] },
    ],
    appOpen: { type: Boolean, default: true },
    signupQuestions: [
      {
        gameId: { type: String },
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
      default: sharedConfig.defaultSignupStrategy,
    },
    programUpdateLastRun: { type: Date, default: Date.now },
    assignmentLastRun: { type: Date, default: Date.now },
    latestServerStartTime: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  "Settings",
  SettingsSchema,
);
