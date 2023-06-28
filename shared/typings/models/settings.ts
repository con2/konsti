import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { GameSchema } from "shared/typings/models/game";

export enum SignupQuestionType {
  TEXT = "text",
  SELECT = "select",
}

const SignupQuestionSchema = z.object({
  gameId: z.string(),
  question: z.string(),
  private: z.boolean(),
  type: z.nativeEnum(SignupQuestionType),
  selectOptions: z.array(z.string()),
});

export type SignupQuestion = z.infer<typeof SignupQuestionSchema>;

export const SettingsSchema = z.object({
  hiddenGames: z.array(GameSchema),
  appOpen: z.boolean(),
  signupQuestions: z.array(SignupQuestionSchema),
  signupStrategy: z.nativeEnum(SignupStrategy),
});

export type Settings = z.infer<typeof SettingsSchema>;
