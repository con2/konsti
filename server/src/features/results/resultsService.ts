import { findResults } from "server/features/results/resultsRepository";
import { GetResultsResponse } from "shared/types/api/results";

export const fetchResults = async (): Promise<GetResultsResponse> => {
  const findResultsResult = await findResults();
  if (!findResultsResult.ok) {
    return {
      message: "Getting results failed",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Getting results success",
    status: "success",
    // Individual user results and group snapshots stay out of the public response
    assignmentRuns: findResultsResult.value.map((assignmentResult) => ({
      assignmentTime: assignmentResult.assignmentTime,
      algorithm: assignmentResult.algorithm,
      message: assignmentResult.message,
    })),
  };
};
