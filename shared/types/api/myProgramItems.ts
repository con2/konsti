import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  DirectSignup,
  LotterySignup,
  LotterySignupSchema,
} from "shared/types/models/user";

// POST lottery signup

export const PostLotterySignupsRequestSchema = z.object({
  lotterySignups: z.array(LotterySignupSchema),
  // TODO: Remove startTime and read it from program item on backend
  startTime: z.string(),
});

export type PostLotterySignupsRequest = z.infer<
  typeof PostLotterySignupsRequestSchema
>;

export interface PostLotterSignupsResponse extends ApiResult {
  lotterySignups: readonly LotterySignup[];
}

export interface PostLotterySignupsError extends ApiError {
  errorId: "unknown" | "signupEnded" | "samePriority";
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
  username: z.string(),
  directSignupProgramItemId: z.string(),
});

export type DeleteDirectSignupRequest = z.infer<
  typeof DeleteDirectSignupRequestSchema
>;

export type DeleteDirectSignupResponse = ApiResult;

export interface DeleteDirectSignupError extends ApiError {
  errorId: "unknown" | "signupEnded";
}
