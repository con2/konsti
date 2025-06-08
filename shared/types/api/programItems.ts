import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
} from "shared/types/models/programItem";

// POST update program items

export interface PostUpdateProgramItemsResponse extends ApiResult {
  programItems: ProgramItem[];
}

export interface PostUpdateProgramItemsError extends ApiError {
  errorId: "unknown" | "kompassiError";
}

// GET program items

export interface GetProgramItemsResponse extends ApiResult {
  programItems: ProgramItemWithUserSignups[];
}

export interface GetProgramItemsError extends ApiError {
  errorId: "unknown" | "databaseError";
}
