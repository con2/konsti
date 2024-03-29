import { ApiError, ApiResult } from "shared/types/api/errors";
import { Game, GameWithUsernames } from "shared/types/models/game";

// POST update games

export interface PostUpdateGamesResponse extends ApiResult {
  games: Game[];
}

export interface PostUpdateGamesError extends ApiError {
  errorId: "unknown";
}

// GET games

export interface GetGamesResponse extends ApiResult {
  games: GameWithUsernames[];
}

export interface GetGamesError extends ApiError {
  errorId: "unknown";
}
