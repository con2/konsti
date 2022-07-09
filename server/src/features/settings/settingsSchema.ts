import mongoose from "mongoose";
import { RequiredBoolean, RequiredString } from "server/db/mongooseTypes";
import { SettingsDoc } from "server/typings/settings.typings";
import { sharedConfig } from "shared/config/sharedConfig";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
        default: [],
        required: true,
      },
    ],
    signupTime: { type: Date, default: null },
    appOpen: { type: Boolean, default: true, required: true },
    signupQuestions: [
      {
        gameId: RequiredString,
        message: RequiredString,
        private: RequiredBoolean,
      },
    ],
    signupStrategy: {
      type: String,
      default: sharedConfig.defaultSignupStrategy,
      required: true,
    },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  "Settings",
  SettingsSchema
);
