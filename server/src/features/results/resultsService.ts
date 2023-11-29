import { findResult } from "server/features/results/resultsRepository";
import { ApiError } from "shared/types/api/errors";
import { GetResultsResponse } from "shared/types/api/results";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const fetchResults = async (
  startTime: string,
): Promise<GetResultsResponse | ApiError> => {
  const resultsResult = await findResult(startTime);
  if (isErrorResult(resultsResult)) {
    return {
      message: "Getting results failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const results = unwrapResult(resultsResult);

  if (!results) {
    return {
      message: "Getting results success",
      status: "success",
      results: [],
      startTime,
    };
  }

  return {
    message: "Getting results success",
    status: "success",
    results: results.results,
    startTime: results.startTime,
  };
};
