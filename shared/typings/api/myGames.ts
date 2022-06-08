import { z } from "zod";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ApiError } from "shared/typings/api/errors";
import { SelectedGame } from "shared/typings/models/user";

export interface PostSignedGamesResponse {
  message: string;
  signedGames: readonly SelectedGame[];
  status: "success";
}

export interface PostSignedGamesError extends ApiError {
  errorId: "unknown" | "signupEnded" | "samePriority";
}

export interface SignupData {
  username: string;
  selectedGames: readonly SelectedGame[];
  signupTime: string;
}

export interface PostEnteredGameResponse {
  message: string;
  status: "success";
  enteredGame: SelectedGame;
}

export interface PostEnteredGameError extends ApiError {
  errorId: "unknown" | "gameFull" | "signupEnded" | "phaseGap";
}

export interface DeleteEnteredGameResponse {
  message: string;
  status: "success";
}

export const PostEnteredGameParametersSchema = z.object({
  username: z.string(),
  enteredGameId: z.string(),
  startTime: z.string(),
  message: z.string().max(SIGNUP_MESSAGE_LENGTH, "Message too long"),
});

export type PostEnteredGameParameters = z.infer<
  typeof PostEnteredGameParametersSchema
>;

export const DeleteEnteredGameParametersSchema = z.object({
  username: z.string(),
  enteredGameId: z.string(),
  startTime: z.string(),
});

export type DeleteEnteredGameParameters = z.infer<
  typeof DeleteEnteredGameParametersSchema
>;
