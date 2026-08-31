import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import {
  EventMetrics,
  RunMetrics,
} from "server/test/scripts/simulate-lottery/runMetrics";

export interface Baseline {
  event: string;
  algorithm: AssignmentAlgorithm;
  totals: EventMetrics;
  runs: RunMetrics[];
}

export interface BaselineDiff {
  field: string;
  baseline: string;
  current: string;
}

const baselineDir = path.join(import.meta.dirname, "baselines");

const baselineFile = (event: string, algorithm: AssignmentAlgorithm): string =>
  path.join(
    baselineDir,
    `${event.replace("/", "-")}-${algorithm.replace("+", "-")}.json`,
  );

export const readBaseline = (
  event: string,
  algorithm: AssignmentAlgorithm,
): Baseline | undefined => {
  const file = baselineFile(event, algorithm);
  if (!fs.existsSync(file)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as Baseline;
};

export const writeBaseline = async (baseline: Baseline): Promise<string> => {
  fs.mkdirSync(baselineDir, { recursive: true });
  const file = baselineFile(baseline.event, baseline.algorithm);
  fs.writeFileSync(
    file,
    await prettier.format(JSON.stringify(baseline), { parser: "json" }),
    "utf8",
  );
  return file;
};

// Compared run by run and keyed on the start time rather than on position, so a run that
// disappears is reported as missing instead of shifting every run after it
export const compareToBaseline = (
  baseline: Baseline,
  current: Baseline,
): BaselineDiff[] => {
  const diffs: BaselineDiff[] = [];

  const currentByTime = new Map(
    current.runs.map((run) => [run.assignmentTime, run]),
  );

  for (const baselineRun of baseline.runs) {
    const currentRun = currentByTime.get(baselineRun.assignmentTime);
    if (!currentRun) {
      diffs.push({
        field: `${baselineRun.assignmentTime} run`,
        baseline: "present",
        current: "missing",
      });
      continue;
    }
    currentByTime.delete(baselineRun.assignmentTime);

    for (const key of Object.keys(baselineRun) as (keyof RunMetrics)[]) {
      const baselineValue = JSON.stringify(baselineRun[key]);
      const currentValue = JSON.stringify(currentRun[key]);
      if (baselineValue !== currentValue) {
        diffs.push({
          field: `${baselineRun.assignmentTime} ${key}`,
          baseline: baselineValue,
          current: currentValue,
        });
      }
    }
  }

  for (const assignmentTime of currentByTime.keys()) {
    diffs.push({
      field: `${assignmentTime} run`,
      baseline: "missing",
      current: "present",
    });
  }

  return diffs;
};
