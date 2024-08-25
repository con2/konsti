import { z } from "zod";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import {
  ProgramItem,
  ProgramItemSchema,
} from "shared/types/models/programItem";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
  SignupQuestionSchema,
} from "shared/types/models/settings";
import { ApiResult } from "shared/types/api/errors";

// POST hidden

export const PostHiddenRequestSchema = z.object({
  hiddenData: z.array(ProgramItemSchema).readonly(),
});

export type PostHiddenRequest = z.infer<typeof PostHiddenRequestSchema>;

export interface PostHiddenResponse extends ApiResult {
  hiddenProgramItems: readonly ProgramItem[];
}

// GET settings

export interface SettingsPayload {
  hiddenProgramItems: readonly ProgramItem[];
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
