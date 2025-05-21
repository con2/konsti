import mongoose from "mongoose";
import { z } from "zod";
import { config } from "shared/config";
import { SignupQuestionSchema } from "shared/types/models/settings";
import {
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";

export const SettingsSchemaDb = z
  .object({
    hiddenProgramItemIds: z.array(z.string()),
    appOpen: z.boolean(),
    signupQuestions: z.array(SignupQuestionSchema),
    signupStrategy: z.nativeEnum(EventSignupStrategy),
    programUpdateLastRun: z.date(),
    assignmentLastRun: z.date(),
    latestServerStartTime: z.date(),
    loginProvider: z.nativeEnum(LoginProvider),
  })
  .strip();

type SettingsDb = z.infer<typeof SettingsSchemaDb>;

const settingsSchema = new mongoose.Schema<SettingsDb>(
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
    programUpdateLastRun: {
      type: Date,
      get: (value: Date) => new Date(value),
      default: () => new Date(),
    },
    assignmentLastRun: {
      type: Date,
      get: (value: Date) => new Date(value),
      default: () => new Date(),
    },
    latestServerStartTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      default: () => new Date(),
    },
    loginProvider: {
      type: String,
      default: config.server().defaultLoginProvider,
    },
  },
  { timestamps: true },
);

export const SettingsModel = mongoose.model<SettingsDb>(
  "settings",
  settingsSchema,
);
