import { createHash } from "node:crypto";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { AssignmentResultStatus } from "server/types/resultTypes";

export interface RunMetrics {
  assignmentTime: string;
  status: AssignmentResultStatus;
  entrants: number;
  placed: number;
  // How many of the placements landed on each preference. Index 0 is a first choice.
  placedByPriority: number[];
  programItemsLotteried: number;
  spotsOffered: number;
  programItemsUnderMinAttendance: number;
  // Exact enough that any change in who got what shows up, small enough to read in a diff
  placementsDigest: string;
}

export interface EventMetrics {
  runs: number;
  entrants: number;
  placed: number;
  placedByPriority: number[];
  spotsOffered: number;
  programItemsUnderMinAttendance: number;
}

const digestPlacements = (results: readonly UserAssignmentResult[]): string => {
  const lines = results
    .map(
      (result) =>
        `${result.username}:${result.assignmentSignup.programItemId}:${result.assignmentSignup.priority}`,
    )
    .toSorted((a, b) => a.localeCompare(b));
  return createHash("sha256")
    .update(lines.join("\n"))
    .digest("hex")
    .slice(0, 16);
};

export const placementLines = (
  results: readonly UserAssignmentResult[],
): string[] =>
  results
    .map(
      (result) =>
        `${result.username}\t${result.assignmentSignup.programItemId}\t${result.assignmentSignup.priority}`,
    )
    .toSorted((a, b) => a.localeCompare(b));

const countByPriority = (
  results: readonly UserAssignmentResult[],
): number[] => {
  const counts = [0, 0, 0];
  for (const result of results) {
    const index = result.assignmentSignup.priority - 1;
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
};

interface BuildRunMetricsParams {
  assignmentTime: string;
  status: AssignmentResultStatus;
  results: readonly UserAssignmentResult[];
  entrants: number;
  lotteriedProgramItems: readonly ProgramItem[];
}

export const buildRunMetrics = ({
  assignmentTime,
  status,
  results,
  entrants,
  lotteriedProgramItems,
}: BuildRunMetricsParams): RunMetrics => {
  const placedPerProgramItem = new Map<string, number>();
  for (const result of results) {
    const { programItemId } = result.assignmentSignup;
    placedPerProgramItem.set(
      programItemId,
      (placedPerProgramItem.get(programItemId) ?? 0) + 1,
    );
  }

  return {
    assignmentTime,
    status,
    entrants,
    placed: results.length,
    placedByPriority: countByPriority(results),
    programItemsLotteried: lotteriedProgramItems.length,
    spotsOffered: lotteriedProgramItems.reduce(
      (total, programItem) => total + programItem.maxAttendance,
      0,
    ),
    programItemsUnderMinAttendance: lotteriedProgramItems.filter(
      (programItem) =>
        (placedPerProgramItem.get(programItem.programItemId) ?? 0) <
        programItem.minAttendance,
    ).length,
    placementsDigest: digestPlacements(results),
  };
};

export const sumEventMetrics = (runs: readonly RunMetrics[]): EventMetrics => ({
  runs: runs.length,
  entrants: runs.reduce((total, run) => total + run.entrants, 0),
  placed: runs.reduce((total, run) => total + run.placed, 0),
  placedByPriority: runs.reduce(
    (totals, run) =>
      totals.map((total, index) => total + (run.placedByPriority[index] ?? 0)),
    [0, 0, 0],
  ),
  spotsOffered: runs.reduce((total, run) => total + run.spotsOffered, 0),
  programItemsUnderMinAttendance: runs.reduce(
    (total, run) => total + run.programItemsUnderMinAttendance,
    0,
  ),
});
