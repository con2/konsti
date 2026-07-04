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

export interface PostLotterySignupResult extends ApiResult {
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
    | "noKonstiSignup"
    | "groupMember";
}

export type PostLotterySignupResponse =
  | PostLotterySignupResult
  | PostLotterySignupError;

// DELETE lottery signup

export const DeleteLotterySignupRequestSchema = z.object({
  lotterySignupProgramItemId: z.string(),
});

export type DeleteLotterySignupRequest = z.infer<
  typeof DeleteLotterySignupRequestSchema
>;

type DeleteLotterySignupResult = ApiResult;

export interface DeleteLotterySignupError extends ApiError {
  errorId: "unknown" | "signupEnded" | "programItemNotFound";
}

export type DeleteLotterySignupResponse =
  | DeleteLotterySignupResult
  | DeleteLotterySignupError;

// POST direct signup

export const PostDirectSignupRequestSchema = z.object({
  directSignupProgramItemId: z.string(),
  message: z.string().max(SIGNUP_MESSAGE_LENGTH, "Message too long"),
  // priority is not part of the request: user-made direct signups are always
  // first-come-first-served, so the backend sets DIRECT_SIGNUP_PRIORITY itself
});

export type PostDirectSignupRequest = z.infer<
  typeof PostDirectSignupRequestSchema
>;

export interface PostDirectSignupResult extends ApiResult {
  allSignups: {
    programItemId: string;
    userSignups: { username: string; message: string }[];
  };
  directSignup?: DirectSignup;
  // True when a direct signup made the user leave or close their group
  leftGroup: boolean;
}

export interface PostDirectSignupError extends ApiError {
  errorId:
    | "unknown"
    | "signupEnded"
    | "signupNotOpenYet"
    | "noKonstiSignup"
    | "cancelled";
}

export type PostDirectSignupResponse =
  | PostDirectSignupResult
  | PostDirectSignupError;

// DELETE direct signup

export const DeleteDirectSignupRequestSchema = z.object({
  directSignupProgramItemId: z.string(),
});

export type DeleteDirectSignupRequest = z.infer<
  typeof DeleteDirectSignupRequestSchema
>;

interface DeleteDirectSignupResult extends ApiResult {
  allSignups: {
    programItemId: string;
    userSignups: { username: string; message: string }[];
  };
}

interface DeleteDirectSignupError extends ApiError {
  errorId: "unknown" | "signupEnded";
}

export type DeleteDirectSignupResponse =
  | DeleteDirectSignupResult
  | DeleteDirectSignupError;
