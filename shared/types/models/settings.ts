import { z } from "zod";
import { LoginProvider, SignupStrategy } from "shared/config/eventConfigTypes";
import { ProgramItemSchema } from "shared/types/models/programItem";

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
  hiddenProgramItems: z.array(ProgramItemSchema),
  appOpen: z.boolean(),
  signupQuestions: z.array(SignupQuestionSchema),
  signupStrategy: z.nativeEnum(SignupStrategy),
  programUpdateLastRun: z.string(),
  assignmentLastRun: z.string(),
  latestServerStartTime: z.string(),
  loginProvider: z.nativeEnum(LoginProvider),
});

export type Settings = z.infer<typeof SettingsSchema>;
