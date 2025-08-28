import { z } from "zod";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
  SignupQuestionSchema,
} from "shared/types/models/settings";
import { ApiError, ApiResult } from "shared/types/api/errors";

// POST hidden

export const PostHiddenRequestSchema = z.object({
  hiddenProgramItemIds: z.array(z.string()).readonly(),
});

export type PostHiddenRequest = z.infer<typeof PostHiddenRequestSchema>;

export interface PostHiddenResponse extends ApiResult {
  hiddenProgramItemIds: readonly string[];
}

export interface PostHiddenError extends ApiError {
  errorId: "unknown";
}

// GET settings

export interface SettingsPayload {
  hiddenProgramItemIds: readonly string[];
  appOpen: boolean;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy;
  loginProvider: LoginProvider;
  emailNotificationTrigger: EmailNotificationTrigger;
}

export type GetSettingsResponse = SettingsPayload & ApiResult;

export interface GetSettingsError extends ApiError {
  errorId: "unknown";
}

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

export interface PostSignupQuestionError extends ApiError {
  errorId: "unknown";
}

// DELETE signup question

export const DeleteSignupQuestionRequestSchema = z.object({
  programItemId: z.string(),
});

export type DeleteSignupQuestionRequest = z.infer<
  typeof DeleteSignupQuestionRequestSchema
>;

export type DeleteSignupQuestionResponse = PostSignupQuestionResponse;

export interface DeleteSignupQuestionError extends ApiError {
  errorId: "unknown";
}

// POST settings

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

export interface PostSettingsResponse extends ApiResult {
  settings: Settings;
}

export interface PostSettingsError extends ApiError {
  errorId: "unknown";
}
