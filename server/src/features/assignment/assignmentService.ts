import { Request, Response } from "express";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { ApiError } from "shared/types/api/errors";
import { config } from "shared/config";
import { isSuccessResult, unwrapResult } from "shared/utils/result";

export const storeAssignment = async (
  startTime: string,
): Promise<PostAssignmentResponse | ApiError> => {
  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: config.event().assignmentAlgorithm,
    startTime,
  });

  if (isSuccessResult(assignResultsResult)) {
    const assignResults = unwrapResult(assignResultsResult);

    return {
      message: "Assignment success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      startTime,
    };
  }

  return {
    message: `Assignment failed`,
    status: "error",
    errorId: "unknown",
  };
};
