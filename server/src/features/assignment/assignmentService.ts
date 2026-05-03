import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { config } from "shared/config";

export const storeAssignment = async (
  assignmentTime: string,
): Promise<PostAssignmentResponse> => {
  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: config.event().assignmentAlgorithm,
    assignmentTime,
  });

  if (assignResultsResult.ok) {
    const assignResults = assignResultsResult.value;

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
