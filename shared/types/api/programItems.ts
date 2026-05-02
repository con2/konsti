import { ApiError, ApiResult } from "shared/types/api/errors";
import {
  ProgramItem,
  ProgramItemWithUserSignups,
} from "shared/types/models/programItem";

// POST update program items

interface PostUpdateProgramItemsResult extends ApiResult {
  programItems: ProgramItem[];
}

interface PostUpdateProgramItemsError extends ApiError {
  errorId: "unknown" | "kompassiError";
}

export type PostUpdateProgramItemsResponse =
  | PostUpdateProgramItemsResult
  | PostUpdateProgramItemsError;

// GET program items

export interface GetProgramItemsResult extends ApiResult {
  programItems: ProgramItemWithUserSignups[];
}

interface GetProgramItemsError extends ApiError {
  errorId: "unknown" | "databaseError";
}

export type GetProgramItemsResponse =
  | GetProgramItemsResult
  | GetProgramItemsError;
