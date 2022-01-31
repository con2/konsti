import mongoose from "mongoose";
import { SettingsDoc } from "server/typings/settings.typings";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Game", default: [] },
    ],
    signupTime: { type: Date, default: null },
    appOpen: { type: Boolean, default: true },
    signupMessages: [{ gameId: { type: String }, message: { type: String } }],
    signupStrategy: String,
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  "Settings",
  SettingsSchema
);
