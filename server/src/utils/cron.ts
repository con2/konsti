import { Cron } from "croner";
import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { Result, makeSuccessResult } from "shared/utils/result";
import { updateProgramItems } from "server/features/program-item/programItemService";
import {
  acquireAssignmentLock,
  getLatestServerStartTime,
  releaseAssignmentLock,
  saveSettings,
  setAssignmentLastRun,
  setProgramUpdateLastRun,
} from "server/features/settings/settingsRepository";
import { MongoDbError } from "shared/types/api/errors";

const cronJobs: Cron[] = [];

let instanceStartTime = "";

export const setLatestServerStartTime = async (): Promise<
  Result<void, MongoDbError>
> => {
  instanceStartTime = dayjs().toISOString();

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
        name: "autoUpdateProgramItems",
        protect: protectCallback,
        catch: errorHandler,
      },
      autoUpdateProgramItems,
    );
    cronJobs.push(autoUpdateProgramItemsJob);
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
  }
};

export const stopCronJobs = (): void => {
  for (const job of cronJobs) {
    job.stop();
  }

  logger.info("CronJobs stopped");
};

// A deploy starts a replacement instance which overwrites latestServerStartTime, so the
// superseded instance seeing a newer time is expected: stop its cronjobs and let it wait for
// termination. A missing or older stored time means the settings data was lost or rewound,
// which shouldn't happen and is logged as an error
const isLatestServerInstance = async (): Promise<boolean> => {
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
    return false;
  }

  const dbLatestStartTime = dbLatestStartTimeResult.value;
  if (dbLatestStartTime === instanceStartTime) {
    logger.info("Latest server start time found, is latest");
    return true;
  }

  if (dayjs(dbLatestStartTime).isAfter(instanceStartTime)) {
    // TODO: Expected during deploys, change to info level once stopping cronjobs is verified to work
    logger.error(
      new Error(
        "Cronjobs: Newer server instance running, stopping cronjobs on this instance",
      ),
    );
    stopCronJobs();
    return false;
  }

  logger.error(
    new Error(
      `Cronjobs: Stored server start time ${dbLatestStartTime} is older than this instance's start time ${instanceStartTime}`,
    ),
  );
  return false;
};

export const autoUpdateProgramItems = async (): Promise<void> => {
  logger.info("----> Auto update program items");

  if (!(await isLatestServerInstance())) {
    return;
  }

  logger.info("Check if auto update already running...");
  const programUpdateLastRunResult = await setProgramUpdateLastRun(
    dayjs().toISOString(),
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

export const autoAssignAttendees = async (): Promise<void> => {
  const { autoAssignDelay } = config.server();

  logger.info("----> Auto assign attendees");

  if (!(await isLatestServerInstance())) {
    return;
  }

  logger.info("Check if assignment already running...");
  const lockResult = await acquireAssignmentLock();
  if (!lockResult.ok) {
    if (lockResult.error === MongoDbError.ASSIGNMENT_LOCK_HELD) {
      logger.error(new Error("Auto assignment already running, stop"));
      return;
    }
    logger.error(
      new Error(
        `***** Auto assignment failed trying to acquire assignment lock: ${lockResult.error}`,
      ),
    );
    return;
  }
  const lockToken = lockResult.value;

  logger.info("Auto assignment not running, continue");

  try {
    const runAssignmentResult = await runAssignment({
      assignmentAlgorithm: config.event().assignmentAlgorithm,
      assignmentTime: null,
      assignmentDelay: autoAssignDelay,
    });
    if (!runAssignmentResult.ok) {
      logger.error(new Error("***** Auto assignment failed"));
      return;
    }

    // Record the last successful run time
    await setAssignmentLastRun(dayjs().toISOString());

    logger.info("***** Automatic attendee assignment completed");
  } finally {
    await releaseAssignmentLock(lockToken);
  }
};

const protectCallback = (job: Cron): void => {
  const timeNow = dayjs().toISOString();
  const startTime = dayjs(job.currentRun()).toISOString();
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
