import { z } from "zod";
import { LoginProvider, SignupStrategy } from "shared/config/sharedConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
} from "shared/types/models/settings";
import { ApiResult } from "shared/types/api/errors";

// POST hidden

export interface PostHiddenRequest {
  hiddenData: readonly ProgramItem[];
}

export interface PostHiddenResponse extends ApiResult {
  hiddenGames: readonly ProgramItem[];
}

// GET settings

export interface SettingsPayload {
  hiddenGames: readonly ProgramItem[];
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
  programItemId: string;
}

export type DeleteSignupQuestionResponse = PostSignupQuestionResponse;

// POST settings

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

export interface PostSettingsResponse extends ApiResult {
  settings: Settings;
}
