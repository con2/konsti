import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  DirectSignup,
  LotterySignup,
  LotterySignupSchema,
} from "shared/types/models/user";

// POST lottery signup

// TODO: Remove 'time' and read it from program item on backend
export const PostLotterySignupRequestSchema = LotterySignupSchema;

export type PostLotterySignupRequest = z.infer<
  typeof PostLotterySignupRequestSchema
>;

export interface PostLotterSignupResponse extends ApiResult {
  lotterySignups: readonly LotterySignup[];
}

export interface PostLotterySignupError extends ApiError {
  errorId: "unknown" | "signupEnded" | "samePriority";
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
  errorId: "unknown" | "signupEnded";
}

// POST direct signup

export const PostDirectSignupRequestSchema = z.object({
  username: z.string(),
  directSignupProgramItemId: z.string(),
  message: z.string().max(SIGNUP_MESSAGE_LENGTH, "Message too long"),
  priority: z.number(),
});

export type PostDirectSignupRequest = z.infer<
  typeof PostDirectSignupRequestSchema
>;

export interface PostDirectSignupResponse extends ApiResult {
  directSignup: DirectSignup;
}

export interface PostDirectSignupError extends ApiError {
  errorId:
    | "unknown"
    | "programItemFull"
    | "signupEnded"
    | "signupNotOpenYet"
    | "noKonstiSignup";
}

// DELETE direct signup

export const DeleteDirectSignupRequestSchema = z.object({
  directSignupProgramItemId: z.string(),
});

export type DeleteDirectSignupRequest = z.infer<
  typeof DeleteDirectSignupRequestSchema
>;

export type DeleteDirectSignupResponse = ApiResult;

export interface DeleteDirectSignupError extends ApiError {
  errorId: "unknown" | "signupEnded";
}
