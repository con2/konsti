import { randomUUID } from "node:crypto";
import { Cron } from "croner";
import {
  addMilliseconds,
  addMinutes,
  isAfter,
  isBefore,
  subMinutes,
} from "date-fns";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { updateProgramItems } from "server/features/program-item/programItemService";
import {
  acquireAssignmentLock,
  getLatestServerStartTime,
  releaseAssignmentLock,
  saveSettings,
  setAssignmentLastRun,
  setProgramUpdateLastRun,
} from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { sleep } from "server/utils/sleep";

// Retry delays start short, since a failure worth retrying is usually a blip of seconds
const ASSIGNMENT_RETRY_DELAYS_MS = [5, 15, 30, 60].map((seconds) => {
  return seconds * 1000;
});
const ASSIGNMENT_RUN_MARGIN_MINUTES = 5;
// Room for the last start attempt to reach the lock before the update checks it
const PROGRAM_UPDATE_MARGIN_MINUTES = 1;

const PROGRAM_UPDATE_JOB_NAME = "autoUpdateProgramItems";

type ServerInstanceStatus = "latest" | "notLatest" | "unavailable";

type AssignmentStart =
  | { status: "started"; lockToken: string }
  | { status: "stopped" }
  | { status: "unavailable" };

const cronJobs: Cron[] = [];

let instanceStartTime = "";

export const setLatestServerStartTime = async (): Promise<
  Result<void, MongoDbError>
> => {
  instanceStartTime = new Date().toISOString();

  logger.info(`Set latestServerStartTime ${instanceStartTime}`);
  const settingsResult = await saveSettings({
    latestServerStartTime: instanceStartTime,
  });
  if (!settingsResult.ok) {
    return settingsResult;
  }

  return makeSuccessResult();
};

export const startCronJobs = async (): Promise<void> => {
  const {
    autoUpdateProgramEnabled,
    programUpdateInterval,
    autoAssignAttendeesEnabled,
    autoAssignInterval,
  } = config.server();

  // Save latest server instance start time to limit running cronjobs to latest started instance
  const latestServerStartResult = await setLatestServerStartTime();
  if (!latestServerStartResult.ok) {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error(
      `Error setting latestServerStartTime at server start: ${latestServerStartResult.error}`,
    );
  }

  if (autoUpdateProgramEnabled) {
    logger.info("Start cronjob: program auto update");

    const autoUpdateProgramItemsJob = new Cron(
      programUpdateInterval,
      {
        name: PROGRAM_UPDATE_JOB_NAME,
        protect: protectCallback,
        catch: errorHandler,
      },
      autoUpdateProgramItems,
    );
    cronJobs.push(autoUpdateProgramItemsJob);
  } else {
    logger.info("Cronjob disabled in config: program auto update");
  }

  if (autoAssignAttendeesEnabled) {
    logger.info("Start cronjob: automatic attendee assignment");

    const autoAssignAttendeesJob = new Cron(
      autoAssignInterval,
      {
        name: "autoAssignAttendees",
        protect: protectCallback,
        catch: errorHandler,
      },
      autoAssignAttendees,
    );
    cronJobs.push(autoAssignAttendeesJob);
  } else {
    logger.info("Cronjob disabled in config: automatic attendee assignment");
  }
};

export const stopCronJobs = (): void => {
  for (const job of cronJobs) {
    job.stop();
  }

  logger.info("CronJobs stopped");
};

const cronJobsStopped = (): boolean => {
  return cronJobs.length > 0 && cronJobs.every((job) => job.isStopped());
};

// A deploy starts a replacement instance which overwrites latestServerStartTime, so the
// superseded instance seeing a newer time is expected: stop its cronjobs and let it wait for
// termination. A missing or older stored time means the settings data was lost or rewound,
// which shouldn't happen and is logged as an error.
const getServerInstanceStatus = async (): Promise<ServerInstanceStatus> => {
  logger.info(
    `Check if latest running server instance with start time ${instanceStartTime}`,
  );
  const dbLatestStartTimeResult = await getLatestServerStartTime();
  if (!dbLatestStartTimeResult.ok) {
    logger.error(
      new Error(
        `Cronjobs: Failed to get latest server start time: ${dbLatestStartTimeResult.error}`,
      ),
    );
    return "unavailable";
  }

  const dbLatestStartTime = dbLatestStartTimeResult.value;
  if (dbLatestStartTime === instanceStartTime) {
    logger.info("Latest server start time found, is latest");
    return "latest";
  }

  if (isAfter(new Date(dbLatestStartTime), new Date(instanceStartTime))) {
    // TODO: Expected during deploys, change to info level once stopping cronjobs is verified to work
    logger.error(
      new Error(
        "Cronjobs: Newer server instance running, stopping cronjobs on this instance",
      ),
    );
    stopCronJobs();
    return "notLatest";
  }

  logger.error(
    new Error(
      `Cronjobs: Stored server start time ${dbLatestStartTime} is older than this instance's start time ${instanceStartTime}`,
    ),
  );
  return "notLatest";
};

export const autoUpdateProgramItems = async (): Promise<void> => {
  logger.info("----> Auto update program items");

  if ((await getServerInstanceStatus()) !== "latest") {
    return;
  }

  logger.info("Check if auto update already running...");
  const programUpdateLastRunResult = await setProgramUpdateLastRun(
    new Date().toISOString(),
  );
  if (!programUpdateLastRunResult.ok) {
    if (programUpdateLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.error(new Error("Program auto update already running, stop"));
      return;
    }
    logger.error(
      new Error(
        `***** Program items auto update failed trying to set last run time: ${programUpdateLastRunResult.error}`,
      ),
    );
    return;
  }

  logger.info("Auto update not running, continue");

  const updateProgramItemsResult = await updateProgramItems();
  if (
    updateProgramItemsResult.status === "error" &&
    updateProgramItemsResult.errorId === "assignmentInProgress"
  ) {
    logger.info("Lottery in progress, program update left to the next tick");
    return;
  }
  if (updateProgramItemsResult.status === "error") {
    logger.error(
      new Error(
        `***** Program items auto update failed: ${updateProgramItemsResult.message}`,
      ),
    );
    return;
  }

  logger.info("***** Program items auto update completed");
};

const tryStartAssignment = async (
  lockToken: string,
): Promise<AssignmentStart> => {
  const instanceStatus = await getServerInstanceStatus();
  if (instanceStatus === "unavailable") {
    return { status: "unavailable" };
  }
  if (instanceStatus === "notLatest") {
    return { status: "stopped" };
  }

  logger.info("Check if assignment already running...");
  const lockResult = await acquireAssignmentLock(lockToken);
  if (!lockResult.ok) {
    if (lockResult.error === MongoDbError.ASSIGNMENT_LOCK_HELD) {
      logger.error(new Error("Auto assignment already running, stop"));
      return { status: "stopped" };
    }
    logger.error(
      new Error(
        `***** Auto assignment failed trying to acquire assignment lock: ${lockResult.error}`,
      ),
    );
    return { status: "unavailable" };
  }

  return { status: "started", lockToken: lockResult.value };
};

// The scheduled program update would find the lock free while a failed start waits to retry,
// so retrying stops a margin before it is due. Direct sign-up opening is the outer limit, for when
// no program update is scheduled.
const getLastRetryTime = (): Date => {
  const beforeDirectSignup = addMinutes(
    new Date(),
    config.event().phaseGap - ASSIGNMENT_RUN_MARGIN_MINUTES,
  );
  const nextProgramUpdate = cronJobs
    .findLast((job) => job.name === PROGRAM_UPDATE_JOB_NAME && !job.isStopped())
    ?.nextRun();
  const beforeProgramUpdate =
    nextProgramUpdate &&
    subMinutes(nextProgramUpdate, PROGRAM_UPDATE_MARGIN_MINUTES);
  return beforeProgramUpdate &&
    isBefore(beforeProgramUpdate, beforeDirectSignup)
    ? beforeProgramUpdate
    : beforeDirectSignup;
};

// Whether to try again, having waited out the delay for this attempt
const waitBeforeRetry = async (
  attempt: number,
  lastRetryTime: Date,
  assignmentTime: string,
): Promise<boolean> => {
  const abandonIfStopped = (): boolean => {
    if (!cronJobsStopped()) {
      return false;
    }
    logger.error(
      new Error(
        `***** Auto assignment abandoned start time ${assignmentTime} as cronjobs stopped. If a lottery was due, run it manually before direct sign-up opens`,
      ),
    );
    return true;
  };

  if (abandonIfStopped()) {
    return false;
  }
  const delayMs =
    ASSIGNMENT_RETRY_DELAYS_MS[
      Math.min(attempt, ASSIGNMENT_RETRY_DELAYS_MS.length - 1)
    ];
  if (isAfter(addMilliseconds(new Date(), delayMs), lastRetryTime)) {
    logger.error(
      new Error(
        `***** Auto assignment gave up on start time ${assignmentTime}. If a lottery was due, run it manually before direct sign-up opens`,
      ),
    );
    return false;
  }

  logger.warn(
    `Auto assignment for start time ${assignmentTime} did not complete, retrying in ${delayMs / 1000}s`,
  );
  await sleep(delayMs);
  return !abandonIfStopped();
};

export const autoAssignAttendees = async (): Promise<void> => {
  logger.info("----> Auto assign attendees");

  // Resolved once because a retry must lottery the start time this tick was due, and a later
  // clock reading names a different one
  const assignmentTimeResult = await getDynamicStartTime();
  if (!assignmentTimeResult.ok) {
    logger.error(
      new Error(
        `***** Auto assignment failed resolving its start time: ${assignmentTimeResult.error}`,
      ),
    );
    return;
  }
  const assignmentTime = assignmentTimeResult.value;
  // One token for the whole tick, so a retry recognizes a lock its own earlier attempt took
  const lockToken = randomUUID();
  const lastRetryTime = getLastRetryTime();

  let attempt = 0;
  // The lock is released on every way out, the starting ones included: a lost reply can leave
  // this tick holding a lock it never heard it took
  try {
    let assignmentStart = await tryStartAssignment(lockToken);
    while (assignmentStart.status === "unavailable") {
      if (!(await waitBeforeRetry(attempt, lastRetryTime, assignmentTime))) {
        return;
      }
      attempt++;
      assignmentStart = await tryStartAssignment(lockToken);
    }
    if (assignmentStart.status === "stopped") {
      return;
    }

    logger.info("Auto assignment not running, continue");

    // A run that returns an error is retried whole, since a run is built to be run again after
    // failing at any point. The lock stays held between attempts, which keeps a program update out.
    for (;;) {
      const runAssignmentResult = await runAssignment({
        assignmentAlgorithm: config.event().assignmentAlgorithm,
        assignmentTime,
        assignmentDelay: config.server().autoAssignDelay,
      });
      if (runAssignmentResult.ok) {
        break;
      }
      logger.warn(
        `Auto assignment for start time ${assignmentTime} failed: ${runAssignmentResult.error}`,
      );

      // Taking the lock again restarts its time, and an attempt runs only once that has worked,
      // so no attempt runs on a lock gone stale
      for (;;) {
        if (!(await waitBeforeRetry(attempt, lastRetryTime, assignmentTime))) {
          return;
        }
        attempt++;
        const lockRefreshResult = await acquireAssignmentLock(lockToken);
        if (lockRefreshResult.ok) {
          break;
        }
        if (lockRefreshResult.error === MongoDbError.ASSIGNMENT_LOCK_HELD) {
          logger.error(
            new Error(
              `***** Auto assignment lost its lock to another run, stopped retrying start time ${assignmentTime}`,
            ),
          );
          return;
        }
      }
    }

    await setAssignmentLastRun(new Date().toISOString());

    logger.info("***** Automatic attendee assignment completed");
  } catch (error) {
    // Not retried: database failures come back as error results, so what throws is a bug or an
    // input the algorithm rejects, which would fail every attempt the same way
    logger.error(
      new Error(
        `***** Auto assignment for start time ${assignmentTime} threw. If a lottery was due, run it manually before direct sign-up opens`,
        { cause: error },
      ),
    );
  } finally {
    await releaseAssignmentLock(lockToken);
  }
};

const protectCallback = (job: Cron): void => {
  const timeNow = new Date().toISOString();
  // No current run means the blocking call already finished between the block
  // and this log line
  const startTime = job.currentRun()?.toISOString() ?? "unknown";
  logger.error(
    new Error(
      `Cronjob ${job.name} at ${timeNow} was blocked by call started at ${startTime}`,
    ),
  );
};

const errorHandler = (error: unknown, job: Cron): void => {
  logger.error(
    new Error(`Error while running cronJob ${job.name}`, { cause: error }),
  );
};
