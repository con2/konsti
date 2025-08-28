import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import {
  PostAssignmentError,
  PostAssignmentResponse,
} from "shared/types/api/assignment";
import { config } from "shared/config";
import { isSuccessResult, unwrapResult } from "shared/utils/result";

export const storeAssignment = async (
  assignmentTime: string,
): Promise<PostAssignmentResponse | PostAssignmentError> => {
  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: config.event().assignmentAlgorithm,
    assignmentTime,
  });

  if (isSuccessResult(assignResultsResult)) {
    const assignResults = unwrapResult(assignResultsResult);

    return {
      message: "Assignment success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      assignmentTime,
    };
  }

  return {
    message: "Assignment failed",
    status: "error",
    errorId: "unknown",
  };
};
