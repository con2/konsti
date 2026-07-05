import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";
import { config } from "shared/config";
import { SignupQuestionSchema } from "shared/types/models/settings";
import {
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export const SettingsSchemaDb = z
  .object({
    hiddenProgramItemIds: z.array(z.string()),
    appOpen: z.boolean(),
    signupQuestions: z.array(SignupQuestionSchema),
    signupStrategy: z.enum(EventSignupStrategy),
    programUpdateLastRun: z
      .date()
      .transform((date) => dayjs(date).toISOString()),
    assignmentLastRun: z.date().transform((date) => dayjs(date).toISOString()),
    latestServerStartTime: z
      .date()
      .transform((date) => dayjs(date).toISOString()),
    loginProvider: z.enum(LoginProvider),
    emailNotificationTrigger: z.array(z.enum(EmailNotificationTrigger)),
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
      default: config.event().defaultSignupStrategy,
    },
    programUpdateLastRun: {
      type: Date,
      get: (value: Date) => new Date(value),
      default: () => new Date(),
    },
    assignmentLastRun: {
      type: Date,
      get: (value: Date) => new Date(value),
      // Epoch (not "now") so a fresh settings row means "no assignment has run yet" — set to
      // the run time on each successful assignment
      default: () => new Date(0),
    },
    assignmentInProgressStartTime: {
      type: Date,
      // The assignment-in-progress lock: null means free, otherwise the time the running
      // assignment acquired it. Held for the whole run and reset to null on completion; a held
      // lock older than the stale timeout is treated as abandoned (a crashed run) so a crash
      // can't deadlock assignments. Fresh row starts free (null)
      default: null,
    },
    latestServerStartTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      // Epoch (not "now") so a settings row recreated mid-run reads as older than any live
      // instance and the cron guard surfaces it as an error — a "now" default would masquerade
      // as a newer server instance and silently stop cronjobs. Server start overwrites this
      default: () => new Date(0),
    },
    loginProvider: {
      type: String,
      default: config.event().defaultLoginProvider,
    },
    emailNotificationTrigger: {
      type: [String],
      default: config.server().emailNotificationTrigger,
    },
  },
  { timestamps: true },
);

export const SettingsModel = mongoose.model("settings", settingsSchema);
