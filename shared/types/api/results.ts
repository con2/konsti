import { AssignmentRun } from "shared/types/models/result";
import { ApiError, ApiResult } from "shared/types/api/errors";

// GET results

interface GetResultsResult extends ApiResult {
  assignmentRuns: AssignmentRun[];
}

interface GetResultsError extends ApiError {
  errorId: "unknown";
}

export type GetResultsResponse = GetResultsResult | GetResultsError;
