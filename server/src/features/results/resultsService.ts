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
    // A run that put at least one program item through a lottery is recorded whatever it
    // placed, so a missing record means the lottery never ran for that start time. One that
    // placed nobody holds nothing an attendee could read, so it stays out of the dashboard.
    // Individual user results and group snapshots stay out of the public response too
    assignmentRuns: findResultsResult.value
      .filter((assignmentResult) => assignmentResult.results.length > 0)
      .map((assignmentResult) => ({
        assignmentTime: assignmentResult.assignmentTime,
        algorithm: assignmentResult.algorithm,
        message: assignmentResult.message,
      })),
  };
};
