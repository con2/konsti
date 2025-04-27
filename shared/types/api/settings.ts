import { z } from "zod";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
  SignupQuestionSchema,
} from "shared/types/models/settings";
import { ApiResult } from "shared/types/api/errors";

// POST hidden

export const PostHiddenRequestSchema = z.object({
  hiddenProgramItemIds: z.array(z.string()).readonly(),
});

export type PostHiddenRequest = z.infer<typeof PostHiddenRequestSchema>;

export interface PostHiddenResponse extends ApiResult {
  hiddenProgramItemIds: readonly string[];
}

// GET settings

export interface SettingsPayload {
  hiddenProgramItemIds: readonly string[];
  appOpen: boolean;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy;
  loginProvider: LoginProvider;
}

export type GetSettingsResponse = SettingsPayload & ApiResult;

// POST signup question

export const PostSignupQuestionRequestSchema = z.object({
  signupQuestion: SignupQuestionSchema,
});

export type PostSignupQuestionRequest = z.infer<
  typeof PostSignupQuestionRequestSchema
>;

export interface PostSignupQuestionResponse extends ApiResult {
  signupQuestions: readonly SignupQuestion[];
}

// DELETE signup question

export const DeleteSignupQuestionRequestSchema = z.object({
  programItemId: z.string(),
});

export type DeleteSignupQuestionRequest = z.infer<
  typeof DeleteSignupQuestionRequestSchema
>;

export type DeleteSignupQuestionResponse = PostSignupQuestionResponse;

// POST settings

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

export interface PostSettingsResponse extends ApiResult {
  settings: Settings;
}
