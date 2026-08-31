import { UserAssignmentResult } from "shared/types/models/result";

export interface HistoryComparison {
  recordedPlaced: number;
  replayPlaced: number;
  // Placements where the same attendee got the same program item both times. Never expected
  // to be all of them: both algorithms draw from randomness, so this measures how close the
  // replay lands, not whether it is correct.
  identicalPlacements: number;
}

const placementKeys = (results: readonly UserAssignmentResult[]): Set<string> =>
  new Set(
    results.map(
      (result) => `${result.username}:${result.assignmentSignup.programItemId}`,
    ),
  );

export const compareToHistory = (
  recorded: readonly UserAssignmentResult[],
  replayed: readonly UserAssignmentResult[],
): HistoryComparison => {
  const recordedKeys = placementKeys(recorded);
  const replayedKeys = placementKeys(replayed);

  return {
    recordedPlaced: recorded.length,
    replayPlaced: replayed.length,
    identicalPlacements: [...replayedKeys].filter((key) =>
      recordedKeys.has(key),
    ).length,
  };
};

export const sumHistoryComparisons = (
  comparisons: readonly HistoryComparison[],
): HistoryComparison => ({
  recordedPlaced: comparisons.reduce(
    (total, comparison) => total + comparison.recordedPlaced,
    0,
  ),
  replayPlaced: comparisons.reduce(
    (total, comparison) => total + comparison.replayPlaced,
    0,
  ),
  identicalPlacements: comparisons.reduce(
    (total, comparison) => total + comparison.identicalPlacements,
    0,
  ),
});
