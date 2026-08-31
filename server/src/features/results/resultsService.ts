import { GetResultsResponse } from "shared/types/api/results";
import { findResults } from "server/features/results/resultsRepository";

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
    // A run that placed nobody is recorded but holds nothing an attendee could read, so the
    // filter belongs here rather than to what gets stored. Individual user results and group
    // snapshots stay out of the public response too.
    assignmentRuns: findResultsResult.value
      .filter((assignmentResult) => assignmentResult.results.length > 0)
      .map((assignmentResult) => ({
        assignmentTime: assignmentResult.assignmentTime,
        algorithm: assignmentResult.algorithm,
        message: assignmentResult.message,
      })),
  };
};
