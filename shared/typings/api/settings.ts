import { z } from "zod";
import { LoginProvider, SignupStrategy } from "shared/config/sharedConfigTypes";
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
}

// GET settings

export interface SettingsPayload {
  hiddenGames: readonly Game[];
  appOpen: boolean;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy;
  loginProvider: LoginProvider;
}

export type GetSettingsResponse = SettingsPayload & ApiResult;

// POST signup question

export interface PostSignupQuestionRequest {
  signupQuestion: SignupQuestion;
}

export interface PostSignupQuestionResponse extends ApiResult {
  signupQuestions: readonly SignupQuestion[];
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
}
