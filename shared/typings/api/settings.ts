import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
} from "shared/typings/models/settings";

export interface PostHiddenRequest {
  hiddenData: readonly Game[];
}

export interface PostHiddenResponse {
  hiddenGames: readonly Game[];
  message: string;
  status: "success";
}

export interface GetSettingsResponse {
  appOpen: boolean;
  hiddenGames: readonly Game[];
  message: string;
  status: "success";
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy;
}

export interface PostSignupQuestionRequest {
  signupQuestion: SignupQuestion;
}

export interface PostSignupQuestionResponse {
  signupQuestions: readonly SignupQuestion[];
  message: string;
  status: "success";
}

export interface DeleteSignupQuestionRequest {
  gameId: string;
}

export type DeleteSignupQuestionResponse = PostSignupQuestionResponse;

export const PostSettingsRequestSchema = SettingsSchema.partial();

export type PostSettingsRequest = z.infer<typeof PostSettingsRequestSchema>;

export interface PostSettingsResponse {
  settings: Settings;
  message: string;
  status: "success";
}
