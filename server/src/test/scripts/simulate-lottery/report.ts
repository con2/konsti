import {
  AssignmentAlgorithm,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { toPercent } from "server/features/statistics/statsUtil";
import { BaselineDiff } from "server/test/scripts/simulate-lottery/baseline";
import { HistoryComparison } from "server/test/scripts/simulate-lottery/historyComparison";
import { LoadedDump } from "server/test/scripts/simulate-lottery/loadPastEventToDb";
import { EventMetrics } from "server/test/scripts/simulate-lottery/runMetrics";

// The report is the point of the script, so it goes to stdout rather than through the logger,
// which interleaves it with the run's own info lines
const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const share = (part: number, whole: number): string =>
  whole === 0 ? "-" : `${toPercent(part / whole)}%`;

const signed = (value: number): string =>
  value >= 0 ? `+${value}` : String(value);

// Both names: the key is what `--event` takes and what the baseline is filed under, the name
// is what the event is called - and for Tracon Hitpoint the two do not resemble each other
export const reportInput = (
  event: string,
  name: string,
  loaded: LoadedDump,
  configFallbacks: readonly (keyof EventConfig)[],
): void => {
  write(`\n${name} (${event})`);
  write(
    `  input: ${loaded.programItems.length} program items, ${loaded.usersWithLotterySignups} attendees with ${loaded.lotterySignups} lottery sign-ups`,
  );
  write(
    `  direct sign-ups: ${loaded.directSignupsLoaded} loaded, ${loaded.directSignupsSkipped} skipped as made after their lottery`,
  );
  write(
    `  preference sets missing a middle choice: ${loaded.preferenceSetsWithHoles}`,
  );
  if (loaded.overCapacityProgramItems.length > 0) {
    write(
      `  program items whose maxAttendance was lowered after they filled, loaded in full:`,
    );
    for (const overCapacity of loaded.overCapacityProgramItems) {
      write(
        `    ${overCapacity.programItemId}: ${overCapacity.held} attendees, maxAttendance now ${overCapacity.maxAttendance}`,
      );
    }
  }
  if (loaded.unexpectedlyDropped > 0) {
    write(
      `  WARNING: the write refused ${loaded.unexpectedlyDropped} direct sign-ups that should have fit`,
    );
  }
  if (configFallbacks.length > 0) {
    write(
      `  WARNING: config taken from the current event for ${configFallbacks.join(", ")}`,
    );
  }
};

export interface ReplayReport {
  algorithm: AssignmentAlgorithm;
  totals: EventMetrics;
  runCount: number;
  history: HistoryComparison;
  elapsedMs: number;
  baselineDiffs: readonly BaselineDiff[] | undefined;
  maxReportedDiffs: number;
}

export const reportReplay = ({
  algorithm,
  totals,
  runCount,
  history,
  elapsedMs,
  baselineDiffs,
  maxReportedDiffs,
}: ReplayReport): void => {
  const [first = 0, second = 0, third = 0] = totals.placedByPriority;

  write(`\n  ${algorithm}`);
  write(
    `    runs ${totals.runs}, placed ${totals.placed} of ${totals.entrants} entrants (${share(totals.placed, totals.entrants)})`,
  );
  write(
    `    preference: 1st ${first} (${share(first, totals.placed)}), 2nd ${second}, 3rd ${third}`,
  );
  write(
    `    capacity: ${totals.placed} of ${totals.spotsOffered} spots lotteried (${share(totals.placed, totals.spotsOffered)}), ${totals.programItemsUnderMinAttendance} program items left under minAttendance`,
  );
  write(
    `    vs history: recorded ${history.recordedPlaced}, replayed ${history.replayPlaced} (${signed(history.replayPlaced - history.recordedPlaced)}), ${history.identicalPlacements} identical placements (${share(history.identicalPlacements, history.recordedPlaced)})`,
  );
  write(
    `    time: ${Math.round(elapsedMs)}ms over ${runCount} runs, ${Math.round(elapsedMs / Math.max(runCount, 1))}ms per run`,
  );

  if (baselineDiffs === undefined) {
    write(`    vs baseline: none recorded yet`);
    return;
  }
  if (baselineDiffs.length === 0) {
    write(`    vs baseline: unchanged`);
    return;
  }
  write(
    `    vs baseline: ${baselineDiffs.length} ${baselineDiffs.length === 1 ? "difference" : "differences"}`,
  );
  for (const diff of baselineDiffs.slice(0, maxReportedDiffs)) {
    write(`      ${diff.field}: ${diff.baseline} -> ${diff.current}`);
  }
  if (baselineDiffs.length > maxReportedDiffs) {
    write(`      ... and ${baselineDiffs.length - maxReportedDiffs} more`);
  }
};

export const reportFailedRun = (
  assignmentTime: string,
  error: string,
): void => {
  write(`    ${assignmentTime}: run failed with ${error}`);
};

// Skipping is an outcome the reader has to see, so it goes to the report rather than the
// logger, which a low log level hides
export const reportSkipped = (
  event: string,
  name: string,
  reason: string,
): void => {
  write(`\n${name} (${event}): not replayed, ${reason}`);
};
