import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  ProgramItem,
  GameWithUsernames,
} from "shared/types/models/programItem";

// POST update games

export interface PostUpdateGamesResponse extends ApiResult {
  games: ProgramItem[];
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
