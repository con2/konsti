import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { SelectedGame } from "shared/types/models/user";
import { GameSchema } from "shared/types/models/game";

// POST signed games

export const PostSignedGamesRequestSchema = z.object({
  selectedGames: z.array(
    z.object({
      gameDetails: GameSchema,
      priority: z.number(),
      time: z.string(),
      message: z.string(),
    }),
  ),
  startTime: z.string(),
});

export type PostSignedGamesRequest = z.infer<
  typeof PostSignedGamesRequestSchema
>;

export interface PostSignedGamesResponse extends ApiResult {
  signedGames: readonly SelectedGame[];
}

export interface PostSignedGamesError extends ApiError {
  errorId: "unknown" | "signupEnded" | "samePriority";
}

// POST entered game

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
  enteredGame: SelectedGame;
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
