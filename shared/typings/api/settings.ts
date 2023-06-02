import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
} from "shared/typings/models/settings";
import { ApiResult } from "shared/typings/api/errors";

// POST hidden

export interface PostHiddenRequest {
  hiddenData: readonly Game[];
}

export interface PostHiddenResponse extends ApiResult {
  hiddenGames: readonly Game[];
  message: string;
}

// GET settings

export interface GetSettingsResponse extends ApiResult {
  appOpen: boolean;
  hiddenGames: readonly Game[];
  message: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy;
}

// POST signup question

export interface PostSignupQuestionRequest {
  signupQuestion: SignupQuestion;
}

export interface PostSignupQuestionResponse extends ApiResult {
  signupQuestions: readonly SignupQuestion[];
  message: string;
}

// DELETE signup question

export interface DeleteSignupQuestionRequest {
  gameId: string;
}

export type DeleteSignupQuestionResponse = PostSignupQuestionResponse;

// POST settings

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

export interface PostSettingsResponse extends ApiResult {
  settings: Settings;
  message: string;
}
