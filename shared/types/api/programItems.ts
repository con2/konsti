import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
} from "shared/types/models/programItem";

// POST update program items

export interface PostUpdateProgramItemsResult extends ApiResult {
  programItems: ProgramItem[];
}

export interface PostUpdateProgramItemsError extends ApiError {
  errorId: "unknown" | "kompassiError";
}

export type PostUpdateProgramItemsResponse =
  | PostUpdateProgramItemsResult
  | PostUpdateProgramItemsError;

// GET program items

export interface GetProgramItemsResult extends ApiResult {
  programItems: ProgramItemWithUserSignups[];
}

export interface GetProgramItemsError extends ApiError {
  errorId: "unknown" | "databaseError";
}

export type GetProgramItemsResponse =
  | GetProgramItemsResult
  | GetProgramItemsError;
