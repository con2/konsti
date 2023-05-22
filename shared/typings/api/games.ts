import { ApiError } from "shared/typings/api/errors";
import { Game, GameWithUsernames } from "shared/typings/models/game";

// POST update games

export interface PostUpdateGamesResponse {
  message: string;
  status: "success";
  games: Game[];
}

export interface PostUpdateGamesError extends ApiError {
  errorId: "unknown";
}

// GET games

export interface GetGamesResponse {
  message: string;
  status: "success";
  games: GameWithUsernames[];
}

export interface GetGamesError extends ApiError {
  errorId: "unknown";
}
