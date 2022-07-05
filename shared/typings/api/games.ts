import { ApiError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";

export interface PostUpdateGamesResponse {
  message: string;
  status: "success";
  games: Game[];
}

export interface PostUpdateGamesError extends ApiError {
  errorId: "unknown";
}

export interface GetGamesResponse {
  message: string;
  status: "success";
  games: GameWithUsernames[];
}

export interface GetGamesError extends ApiError {
  errorId: "unknown";
}

export interface GameWithUsernames {
  game: Game;
  users: UserSignup[];
}

export interface UserSignup {
  username: string;
  signupMessage: string;
}
