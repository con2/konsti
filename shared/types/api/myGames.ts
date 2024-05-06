import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { Signup } from "shared/types/models/user";
import { GameSchema } from "shared/types/models/game";

// POST lottery signup

export const PostLotterySignupsRequestSchema = z.object({
  lotterySignups: z.array(
    z.object({
      gameDetails: GameSchema,
      priority: z.number(),
      time: z.string(),
      message: z.string(),
    }),
  ),
  startTime: z.string(),
});

export type PostLotterySignupsRequest = z.infer<
  typeof PostLotterySignupsRequestSchema
>;

export interface PostLotterSignupsResponse extends ApiResult {
  lotterySignups: readonly Signup[];
}

export interface PostLotterySignupsError extends ApiError {
  errorId: "unknown" | "signupEnded" | "samePriority";
}

// POST direct signup

export const PostEnteredGameRequestSchema = z.object({
  username: z.string(),
  enteredGameId: z.string(),
  startTime: z.string(),
  message: z.string().max(SIGNUP_MESSAGE_LENGTH, "Message too long"),
  priority: z.number(),
});

export type PostEnteredGameRequest = z.infer<
  typeof PostEnteredGameRequestSchema
>;

export interface PostEnteredGameResponse extends ApiResult {
  enteredGame: Signup;
}

export interface PostEnteredGameError extends ApiError {
  errorId:
    | "unknown"
    | "gameFull"
    | "signupEnded"
    | "signupNotOpenYet"
    | "noKonstiSignup";
}

// DELETE entered game

export const DeleteEnteredGameRequestSchema = z.object({
  username: z.string(),
  enteredGameId: z.string(),
  startTime: z.string(),
});

export type DeleteEnteredGameRequest = z.infer<
  typeof DeleteEnteredGameRequestSchema
>;

export type DeleteEnteredGameResponse = ApiResult;

export interface DeleteEnteredGameError extends ApiError {
  errorId: "unknown" | "signupEnded";
}
