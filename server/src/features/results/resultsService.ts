import { logger } from "server/utils/logger";
import { findResult } from "server/features/results/resultsRepository";
import { ApiError } from "shared/typings/api/errors";
import { GetResultsResponse } from "shared/typings/api/results";

export const fetchResults = async (
  startTime: string
): Promise<GetResultsResponse | ApiError> => {
  let results;
  try {
    results = await findResult(startTime);
  } catch (error) {
    logger.error(`Results: ${error}`);
    return {
      message: "Getting results failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (!results) {
    return {
      message: "Getting results success",
      status: "success",
      results: [],
      startTime: startTime,
    };
  }

  return {
    message: "Getting results success",
    status: "success",
    results: results.results,
    startTime: results.startTime,
  };
};
