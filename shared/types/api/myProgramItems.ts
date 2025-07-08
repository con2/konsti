import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { DirectSignup, LotterySignup } from "shared/types/models/user";

// POST lottery signup

export const PostLotterySignupRequestSchema = z.object({
  programItemId: z.string(),
  priority: z.number(),
});

export type PostLotterySignupRequest = z.infer<
  typeof PostLotterySignupRequestSchema
>;

export interface PostLotterySignupResponse extends ApiResult {
  lotterySignups: readonly LotterySignup[];
}

export interface PostLotterySignupError extends ApiError {
  errorId:
    | "unknown"
    | "signupEnded"
    | "samePriority"
    | "invalidPriority"
    | "programItemNotFound"
    | "signupNotOpenYet"
    | "cancelled"
    | "noKonstiSignup";
}

// DELETE lottery signup

export const DeleteLotterySignupRequestSchema = z.object({
  lotterySignupProgramItemId: z.string(),
});

export type DeleteLotterySignupRequest = z.infer<
  typeof DeleteLotterySignupRequestSchema
>;

export type DeleteLotterySignupResponse = ApiResult;

export interface DeleteLotterySignupError extends ApiError {
  errorId: "unknown" | "signupEnded" | "programItemNotFound";
}

// POST direct signup

export const PostDirectSignupRequestSchema = z.object({
  directSignupProgramItemId: z.string(),
  message: z.string().max(SIGNUP_MESSAGE_LENGTH, "Message too long"),
  priority: z.number(),
});

export type PostDirectSignupRequest = z.infer<
  typeof PostDirectSignupRequestSchema
>;

export interface PostDirectSignupResponse extends ApiResult {
  allSignups: {
    programItemId: string;
    userSignups: { username: string; message: string }[];
  };
  directSignup?: DirectSignup;
}

export interface PostDirectSignupError extends ApiError {
  errorId:
    | "unknown"
    | "signupEnded"
    | "signupNotOpenYet"
    | "noKonstiSignup"
    | "cancelled";
}

// DELETE direct signup

export const DeleteDirectSignupRequestSchema = z.object({
  directSignupProgramItemId: z.string(),
});

export type DeleteDirectSignupRequest = z.infer<
  typeof DeleteDirectSignupRequestSchema
>;

export interface DeleteDirectSignupResponse extends ApiResult {
  allSignups: {
    programItemId: string;
    userSignups: { username: string; message: string }[];
  };
}

export interface DeleteDirectSignupError extends ApiError {
  errorId: "unknown" | "signupEnded";
}
