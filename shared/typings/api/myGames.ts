import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/typings/api/errors";
import { SelectedGame } from "shared/typings/models/user";
import { GameSchema } from "shared/typings/models/game";

// POST signed games

export const PostSignedGamesRequestSchema = z.object({
  selectedGames: z.array(
    z.object({
      gameDetails: GameSchema,
      priority: z.number(),
      time: z.string(),
      message: z.string(),
    })
  ),
  startTime: z.string(),
});

export type PostSignedGamesRequest = z.infer<
  typeof PostSignedGamesRequestSchema
>;

export interface PostSignedGamesResponse extends ApiResult {
  message: string;
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
});

export type PostEnteredGameRequest = z.infer<
  typeof PostEnteredGameRequestSchema
>;

export interface PostEnteredGameResponse extends ApiResult {
  message: string;
  enteredGame: SelectedGame;
}

export interface PostEnteredGameError extends ApiError {
  errorId: "unknown" | "gameFull" | "signupEnded" | "signupNotOpenYet";
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

export interface DeleteEnteredGameResponse extends ApiResult {
  message: string;
}

export interface DeleteEnteredGameError extends ApiError {
  errorId: "unknown" | "signupEnded";
}
