import { z } from "zod";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export enum SignupQuestionType {
  TEXT = "text",
  SELECT = "select",
}

const SignupQuestionSelectOptionSchema = z.object({
  optionFi: z.string(),
  optionEn: z.string(),
});

export type SignupQuestionSelectOption = z.infer<
  typeof SignupQuestionSelectOptionSchema
>;

export const SignupQuestionSchema = z.object({
  programItemId: z.string(),
  questionFi: z.string(),
  questionEn: z.string(),
  private: z.boolean(),
  type: z.nativeEnum(SignupQuestionType),
  selectOptions: z.array(SignupQuestionSelectOptionSchema),
});

export type SignupQuestion = z.infer<typeof SignupQuestionSchema>;

export const SettingsSchema = z.object({
  hiddenProgramItemIds: z.array(z.string()),
  appOpen: z.boolean(),
  signupQuestions: z.array(SignupQuestionSchema),
  signupStrategy: z.nativeEnum(EventSignupStrategy),
  programUpdateLastRun: z.string(),
  assignmentLastRun: z.string(),
  latestServerStartTime: z.string(),
  loginProvider: z.nativeEnum(LoginProvider),
  emailNotificationTrigger: z.nativeEnum(EmailNotificationTrigger),
});

export type Settings = z.infer<typeof SettingsSchema>;
