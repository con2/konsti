import { ApiError, ApiResult } from "shared/types/api/errors";
import { AssignmentRun } from "shared/types/models/result";

// GET results

interface GetResultsResult extends ApiResult {
  assignmentRuns: AssignmentRun[];
}

interface GetResultsError extends ApiError {
  errorId: "unknown";
}

export type GetResultsResponse = GetResultsResult | GetResultsError;
