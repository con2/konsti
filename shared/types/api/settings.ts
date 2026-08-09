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

interface PostHiddenResult extends ApiResult {
  hiddenProgramItemIds: readonly string[];
}

interface PostHiddenError extends ApiError {
  errorId: "unknown";
}

export type PostHiddenResponse = PostHiddenResult | PostHiddenError;

// GET settings

export interface SettingsPayload {
  // Git SHA of the running server build, empty when not available. Identifies
  // the deploy; it says nothing about which build is newer
  appVersion: string;
  // Seconds since the epoch at which the running image was built, empty when
  // not available. Deploys are built in the order they go out, so this is what
  // lets a client tell a newer server from one that simply hasn't rolled yet
  appBuildTime: string;
  hiddenProgramItemIds: readonly string[];
  appOpen: boolean;
  adminMessageFi: string;
  adminMessageEn: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy;
  loginProvider: LoginProvider;
  emailNotificationTrigger: readonly EmailNotificationTrigger[];
}

type GetSettingsResult = SettingsPayload & ApiResult;

interface GetSettingsError extends ApiError {
  errorId: "unknown";
}

export type GetSettingsResponse = GetSettingsResult | GetSettingsError;

// POST sign-up question

export const PostSignupQuestionRequestSchema = z.object({
  signupQuestion: SignupQuestionSchema,
});

export type PostSignupQuestionRequest = z.infer<
  typeof PostSignupQuestionRequestSchema
>;

interface PostSignupQuestionResult extends ApiResult {
  signupQuestions: readonly SignupQuestion[];
}

interface PostSignupQuestionError extends ApiError {
  errorId: "unknown";
}

export type PostSignupQuestionResponse =
  | PostSignupQuestionResult
  | PostSignupQuestionError;

// DELETE sign-up question

export const DeleteSignupQuestionRequestSchema = z.object({
  programItemId: z.string(),
});

export type DeleteSignupQuestionRequest = z.infer<
  typeof DeleteSignupQuestionRequestSchema
>;

type DeleteSignupQuestionResult = PostSignupQuestionResult;

interface DeleteSignupQuestionError extends ApiError {
  errorId: "unknown";
}

export type DeleteSignupQuestionResponse =
  | DeleteSignupQuestionResult
  | DeleteSignupQuestionError;

// POST settings

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

interface PostSettingsResult extends ApiResult {
  settings: Settings;
}

interface PostSettingsError extends ApiError {
  errorId: "unknown";
}

export type PostSettingsResponse = PostSettingsResult | PostSettingsError;
