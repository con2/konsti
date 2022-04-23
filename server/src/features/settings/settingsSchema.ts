import mongoose from "mongoose";
import { SettingsDoc } from "server/typings/settings.typings";
import { sharedConfig } from "shared/config/sharedConfig";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Game", default: [] },
    ],
    signupTime: { type: Date, default: null },
    appOpen: { type: Boolean, default: true },
    signupMessages: [{ gameId: { type: String }, message: { type: String } }],
    signupStrategy: {
      type: String,
      default: sharedConfig.defaultSignupStrategy,
    },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  "Settings",
  SettingsSchema
);
