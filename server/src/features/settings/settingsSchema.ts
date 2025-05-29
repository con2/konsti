import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";
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
    programUpdateLastRun: z
      .date()
      .transform((date) => dayjs(date).toISOString()),
    assignmentLastRun: z.date().transform((date) => dayjs(date).toISOString()),
    latestServerStartTime: z
      .date()
      .transform((date) => dayjs(date).toISOString()),
    loginProvider: z.nativeEnum(LoginProvider),
  })
  .strip();

const selectOptionSchema = new mongoose.Schema({
  optionFi: { type: String, required: true },
  optionEn: { type: String, required: true },
});

const signupQuestionSchema = new mongoose.Schema({
  programItemId: { type: String, required: true },
  questionFi: { type: String, required: true },
  questionEn: { type: String, required: true },
  private: { type: Boolean, required: true },
  type: { type: String, required: true },
  selectOptions: { type: [selectOptionSchema], default: [] },
});

const settingsSchema = new mongoose.Schema(
  {
    hiddenProgramItemIds: { type: [String], default: [] },
    appOpen: { type: Boolean, default: true },
    signupQuestions: { type: [signupQuestionSchema], default: [] },
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

export const SettingsModel = mongoose.model("settings", settingsSchema);
