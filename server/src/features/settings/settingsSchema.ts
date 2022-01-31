import mongoose from "mongoose";
import { SettingsDoc } from "server/typings/settings.typings";
import { SignupStrategy } from "shared/config/sharedConfig.types";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Game", default: [] },
    ],
    signupTime: { type: Date, default: null },
    appOpen: { type: Boolean, default: true },
    signupMessages: [{ gameId: { type: String }, message: { type: String } }],
    signupStrategy: { type: String, default: SignupStrategy.DIRECT },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  "Settings",
  SettingsSchema
);
