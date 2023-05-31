import { findResult } from "server/features/results/resultsRepository";
import { ApiError } from "shared/typings/api/errors";
import { GetResultsResponse } from "shared/typings/api/results";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const fetchResults = async (
  startTime: string
): Promise<GetResultsResponse | ApiError> => {
  const resultsAsyncResult = await findResult(startTime);
  if (isErrorResult(resultsAsyncResult)) {
    return {
      message: "Getting results failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const results = unwrapResult(resultsAsyncResult);

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
