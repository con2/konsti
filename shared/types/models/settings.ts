import { z } from "zod";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { ADMIN_MESSAGE_LENGTH_MAX } from "shared/constants/validation";

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
  type: z.enum(SignupQuestionType),
  selectOptions: z.array(SignupQuestionSelectOptionSchema),
});

export type SignupQuestion = z.infer<typeof SignupQuestionSchema>;

export const SettingsSchema = z.object({
  hiddenProgramItemIds: z.array(z.string()),
  appOpen: z.boolean(),
  adminMessageFi: z.string().max(ADMIN_MESSAGE_LENGTH_MAX),
  adminMessageEn: z.string().max(ADMIN_MESSAGE_LENGTH_MAX),
  signupQuestions: z.array(SignupQuestionSchema),
  signupStrategy: z.enum(EventSignupStrategy),
  programUpdateLastRun: z.string(),
  assignmentLastRun: z.string(),
  latestServerStartTime: z.string(),
  loginProvider: z.enum(LoginProvider),
  emailNotificationTrigger: z.array(z.enum(EmailNotificationTrigger)),
});

export type Settings = z.infer<typeof SettingsSchema>;
