import mongoose from "mongoose";
import { RequiredBoolean, RequiredString } from "server/db/mongooseTypes";
import { SettingsDoc } from "server/typings/settings.typings";
import { sharedConfig } from "shared/config/sharedConfig";

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Game",
          default: [],
          required: true,
        },
      ],
      required: true,
    },
    signupTime: { type: Date, default: null },
    appOpen: { type: Boolean, default: true, required: true },
    signupQuestions: {
      type: [
        {
          gameId: RequiredString,
          message: RequiredString,
          private: RequiredBoolean,
        },
      ],
      required: true,
    },
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
