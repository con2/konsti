import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Command, OptionValues } from "commander";
import { subMinutes } from "date-fns";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "shared/config";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import {
  PastEvent,
  findPastEvent,
  getPastEventKey,
  pastEvents,
} from "shared/config/past-events";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import { db } from "server/db/mongodb";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findUsers } from "server/features/user/userRepository";
import {
  Baseline,
  compareToBaseline,
  readBaseline,
  writeBaseline,
} from "server/test/scripts/simulate-lottery/baseline";
import {
  HistoryComparison,
  compareToHistory,
  sumHistoryComparisons,
} from "server/test/scripts/simulate-lottery/historyComparison";
import { loadPastEventToDb } from "server/test/scripts/simulate-lottery/loadPastEventToDb";
import { overrideEventConfig } from "server/test/scripts/simulate-lottery/overrideEventConfig";
import {
  parseAssignmentAlgorithm,
  readPastEventDump,
} from "server/test/scripts/simulate-lottery/pastEventDump";
import {
  reportFailedRun,
  reportInput,
  reportReplay,
  reportSkipped,
} from "server/test/scripts/simulate-lottery/report";
import {
  RunMetrics,
  buildRunMetrics,
  placementLines,
  sumEventMetrics,
} from "server/test/scripts/simulate-lottery/runMetrics";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { seedMathRandom } from "server/test/utils/seededRandom";
import { logger } from "server/utils/logger";

const mongoDbVersion = "8.0.26";
const maxReportedDiffs = 20;

interface Replay {
  runs: RunMetrics[];
  placements: string[];
  historyComparisons: HistoryComparison[];
  elapsedMs: number;
}

// The candidates a run will consider, asked through the run's own start-time filter rather
// than a second idea of what starts here
const findStartingLotteryProgramItems = async (
  assignmentTime: string,
): Promise<Result<readonly ProgramItem[], MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }
  return makeSuccessResult(
    getStartingProgramItems(
      programItemsResult.value.filter((programItem) =>
        isLotterySignupProgramItem(programItem),
      ),
      assignmentTime,
    ),
  );
};

// What the run actually put through a lottery, which is narrower than what starts here: it
// leaves out the ones it passed over for holding sign-ups or found already marked. Read as
// the marks the run added rather than by matching the run's hour, because the mark records a
// program item's own start time and for a batch the two differ.
const findNewlyLotteriedProgramItems = async (
  markedBefore: ReadonlySet<string>,
): Promise<Result<readonly ProgramItem[], MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }
  return makeSuccessResult(
    programItemsResult.value.filter(
      (programItem) =>
        programItem.lotteryRanForStartTime !== undefined &&
        !markedBefore.has(programItem.programItemId),
    ),
  );
};

const findMarkedProgramItemIds = async (): Promise<
  Result<Set<string>, MongoDbError>
> => {
  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }
  return makeSuccessResult(
    new Set(
      programItemsResult.value
        .filter(
          (programItem) => programItem.lotteryRanForStartTime !== undefined,
        )
        .map((programItem) => programItem.programItemId),
    ),
  );
};

const countEntrants = async (
  startingProgramItems: readonly ProgramItem[],
): Promise<Result<number, MongoDbError>> => {
  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }
  const startingIds = new Set(
    startingProgramItems.map((programItem) => programItem.programItemId),
  );
  return makeSuccessResult(
    usersResult.value.filter((user) =>
      user.lotterySignups.some((lotterySignup) =>
        startingIds.has(lotterySignup.programItemId),
      ),
    ).length,
  );
};

interface ReplayEventParams {
  pastEvent: PastEvent;
  algorithm: AssignmentAlgorithm;
  seed: number;
  dbConnString: string;
}

const replayEvent = async ({
  pastEvent,
  algorithm,
  seed,
  dbConnString,
}: ReplayEventParams): Promise<Replay | undefined> => {
  const event = getPastEventKey(pastEvent);
  const configFallbacks = overrideEventConfig(pastEvent.eventConfig);
  const dumpResult = readPastEventDump(pastEvent);
  if (!dumpResult.ok) {
    reportSkipped(event, dumpResult.error);
    return undefined;
  }
  const dump = dumpResult.value;

  const recordedRuns = dump.recordedRuns.toSorted((a, b) =>
    a.assignmentTime.localeCompare(b.assignmentTime),
  );
  if (recordedRuns.length === 0) {
    reportSkipped(event, "it recorded no lottery runs");
    return undefined;
  }

  const lotteriedStartTimes = new Set(
    recordedRuns.map((recordedRun) =>
      new Date(recordedRun.assignmentTime).toISOString(),
    ),
  );

  // A database of its own per event and algorithm, so one replay cannot read another's spots
  await db.connectToDb(dbConnString, randomUUID());
  try {
    const loadResult = await loadPastEventToDb({ dump, lotteriedStartTimes });
    if (!loadResult.ok) {
      logger.error(
        new Error(`${event}: failed to load the dump: ${loadResult.error}`),
      );
      return undefined;
    }
    reportInput(event, loadResult.value, configFallbacks);

    const replay: Replay = {
      runs: [],
      placements: [],
      historyComparisons: [],
      elapsedMs: 0,
    };

    for (const recordedRun of recordedRuns) {
      const { assignmentTime } = recordedRun;

      // The moment the cron would have fired: lottery sign-up has closed, direct sign-up has
      // not opened. The pre-run cleanup gates on it, so a wrong clock changes which sign-ups
      // it deletes before the algorithm ever sees them.
      const testSettingsResult = await saveTestSettings({
        testTime: subMinutes(
          new Date(assignmentTime),
          config.event().directSignupPhaseStart,
        ).toISOString(),
      });
      if (!testSettingsResult.ok) {
        reportFailedRun(assignmentTime, testSettingsResult.error);
        continue;
      }

      const startingResult =
        await findStartingLotteryProgramItems(assignmentTime);
      if (!startingResult.ok) {
        reportFailedRun(assignmentTime, startingResult.error);
        continue;
      }
      const entrantsResult = await countEntrants(startingResult.value);
      if (!entrantsResult.ok) {
        reportFailedRun(assignmentTime, entrantsResult.error);
        continue;
      }
      const markedBeforeResult = await findMarkedProgramItemIds();
      if (!markedBeforeResult.ok) {
        reportFailedRun(assignmentTime, markedBeforeResult.error);
        continue;
      }

      // Reseeded per run rather than once per replay, because the MongoDB driver draws from
      // Math.random too: seeding once would leave every run after the first on a stream the
      // driver had already advanced by an amount nothing here controls
      seedMathRandom(seed);

      const startedAt = performance.now();
      const assignmentResult = await runAssignment({
        assignmentAlgorithm: algorithm,
        assignmentTime,
      });
      replay.elapsedMs += performance.now() - startedAt;

      if (!assignmentResult.ok) {
        reportFailedRun(assignmentTime, assignmentResult.error);
        continue;
      }
      const { results, status } = assignmentResult.value;

      const lotteriedResult = await findNewlyLotteriedProgramItems(
        markedBeforeResult.value,
      );
      if (!lotteriedResult.ok) {
        reportFailedRun(assignmentTime, lotteriedResult.error);
        continue;
      }

      replay.runs.push(
        buildRunMetrics({
          assignmentTime,
          status,
          results,
          entrants: entrantsResult.value,
          lotteriedProgramItems: lotteriedResult.value,
        }),
      );
      replay.placements.push(
        ...placementLines(results).map((line) => `${assignmentTime}\t${line}`),
      );
      replay.historyComparisons.push(
        compareToHistory(recordedRun.results, results),
      );
    }

    return replay;
  } finally {
    await db.gracefulExit();
  }
};

const resolveAlgorithms = (
  option: string | undefined,
  pastEvent: PastEvent,
): AssignmentAlgorithm[] => {
  if (option === "all") {
    return Object.values(AssignmentAlgorithm);
  }
  if (option !== undefined) {
    const algorithm = parseAssignmentAlgorithm(option);
    return algorithm ? [algorithm] : [];
  }
  // 2017 ran an algorithm the codebase no longer has, so its config names none
  const { assignmentAlgorithm } = pastEvent.eventConfig;
  return assignmentAlgorithm ? [assignmentAlgorithm] : [];
};

const writePlacements = (
  outDir: string,
  event: string,
  algorithm: AssignmentAlgorithm,
  placements: readonly string[],
): void => {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(
    outDir,
    `${event.replace("/", "-")}-${algorithm.replace("+", "-")}.tsv`,
  );
  fs.writeFileSync(file, `${placements.join("\n")}\n`, "utf8");
  logger.info(`Placements written to ${file}`);
};

// One replay per process, always - which is what makes a baseline mean the same thing however
// it was produced. The MongoDB driver draws from Math.random too, and how much it has drawn by
// the time a run starts depends on everything the process did before it, so a second replay in
// the same process starts its first run on a shifted stream and lands somewhere else.
const replayOne = async (
  pastEvent: PastEvent,
  algorithm: AssignmentAlgorithm,
  options: OptionValues,
): Promise<number> => {
  const event = getPastEventKey(pastEvent);

  process.env.MONGOMS_VERSION = mongoDbVersion;
  const mongoDb = await MongoMemoryServer.create();
  const replay = await replayEvent({
    pastEvent,
    algorithm,
    seed: Number(options.seed),
    dbConnString: mongoDb.getUri(),
  });
  await mongoDb.stop();

  if (!replay) {
    return 0;
  }

  const current: Baseline = {
    event,
    algorithm,
    totals: sumEventMetrics(replay.runs),
    runs: replay.runs,
  };
  const baseline = readBaseline(event, algorithm);
  const baselineDiffs = baseline
    ? compareToBaseline(baseline, current)
    : undefined;

  reportReplay({
    algorithm,
    totals: current.totals,
    runCount: replay.runs.length,
    history: sumHistoryComparisons(replay.historyComparisons),
    elapsedMs: replay.elapsedMs,
    baselineDiffs,
    maxReportedDiffs,
  });

  writePlacements(String(options.out), event, algorithm, replay.placements);

  if (options.updateBaseline) {
    logger.info(`Baseline written to ${await writeBaseline(current)}`);
    return 0;
  }
  return baselineDiffs && baselineDiffs.length > 0 ? 1 : 0;
};

const forwardedFlags = (options: OptionValues): string[] => [
  "--seed",
  String(options.seed),
  "--out",
  String(options.out),
  ...(options.check ? ["--check"] : []),
  ...(options.updateBaseline ? ["--update-baseline"] : []),
];

// A replay that crashes - on a dump the current models cannot read, say - costs its own event
// and not the rest of them, which is what makes `--event all` usable across a decade of drift
const runInChildProcess = (
  pastEvent: PastEvent,
  algorithm: AssignmentAlgorithm,
  options: OptionValues,
): number => {
  const event = getPastEventKey(pastEvent);
  const child = spawnSync(
    process.execPath,
    [
      ...process.execArgv,
      process.argv[1],
      "--event",
      event,
      "--algorithm",
      algorithm,
      ...forwardedFlags(options),
    ],
    { stdio: "inherit" },
  );
  if (child.status === null) {
    logger.error(
      new Error(`${event} ${algorithm}: replay process did not run`),
    );
    return 1;
  }
  return child.status;
};

const simulateLottery = async (): Promise<number> => {
  const commander = new Command();
  commander
    .option(
      "-e, --event <key>",
      'Event to replay, as "<datafile directory>/<year>", or "all"',
      "ropecon/2025",
    )
    .option(
      "-a, --algorithm <name>",
      'padg, random, random+padg or "all"; defaults to the event\'s own',
    )
    .option("-s, --seed <number>", "Seed for the pinned Math.random", "1")
    .option(
      "-c, --check",
      "Exit non-zero when the output differs from the baseline",
    )
    .option("-u, --update-baseline", "Rewrite the baseline from this run")
    .option(
      "-o, --out <directory>",
      "Where to write the full placement lists",
      "simulate-lottery-output",
    );
  commander.parse(process.argv);
  const options = commander.opts();

  const selectedEvents =
    options.event === "all"
      ? pastEvents
      : pastEvents.filter(
          (pastEvent) => pastEvent === findPastEvent(String(options.event)),
        );
  if (selectedEvents.length === 0) {
    logger.error(
      new Error(
        `Unknown event "${options.event}". Known events: ${pastEvents.map(getPastEventKey).join(", ")}`,
      ),
    );
    return 1;
  }

  const replays = selectedEvents.flatMap((pastEvent) => {
    const algorithms = resolveAlgorithms(
      options.algorithm as string | undefined,
      pastEvent,
    );
    if (algorithms.length === 0) {
      reportSkipped(
        getPastEventKey(pastEvent),
        "its algorithm is not one the codebase still has",
      );
    }
    return algorithms.map((algorithm) => ({ pastEvent, algorithm }));
  });

  // The one selected replay runs here; anything wider fans out, one process each
  if (replays.length === 1) {
    const [{ pastEvent, algorithm }] = replays as [
      { pastEvent: PastEvent; algorithm: AssignmentAlgorithm },
    ];
    const status = await replayOne(pastEvent, algorithm, options);
    return options.check ? status : 0;
  }

  const statuses = replays.map(({ pastEvent, algorithm }) =>
    runInChildProcess(pastEvent, algorithm, options),
  );
  return options.check && statuses.some((status) => status !== 0) ? 1 : 0;
};

try {
  process.exitCode = await simulateLottery();
} catch (error: unknown) {
  logger.error(error);
  process.exitCode = 1;
}
