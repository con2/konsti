import { z } from "zod";
import { LoginProvider, SignupStrategy } from "shared/config/sharedConfigTypes";
import { GameSchema } from "shared/types/models/game";

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

const SignupQuestionSchema = z.object({
  gameId: z.string(),
  questionFi: z.string(),
  questionEn: z.string(),
  private: z.boolean(),
  type: z.nativeEnum(SignupQuestionType),
  selectOptions: z.array(SignupQuestionSelectOptionSchema),
});

export type SignupQuestion = z.infer<typeof SignupQuestionSchema>;

export const SettingsSchema = z.object({
  hiddenGames: z.array(GameSchema),
  appOpen: z.boolean(),
  signupQuestions: z.array(SignupQuestionSchema),
  signupStrategy: z.nativeEnum(SignupStrategy),
  programUpdateLastRun: z.string(),
  assignmentLastRun: z.string(),
  latestServerStartTime: z.string(),
  loginProvider: z.nativeEnum(LoginProvider),
});

export type Settings = z.infer<typeof SettingsSchema>;
