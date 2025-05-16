import { Cron } from "croner";
import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { updateProgramItems } from "server/features/program-item/programItemService";
import {
  isLatestStartedServerInstance,
  saveSettings,
  setAssignmentLastRun,
  setProgramUpdateLastRun,
} from "server/features/settings/settingsRepository";
import { MongoDbError } from "shared/types/api/errors";

const cronJobs: Cron[] = [];

let latestServerStartTime = "";

export const setLatestServerStartTime = async (): Promise<
  Result<void, MongoDbError>
> => {
  latestServerStartTime = dayjs().toISOString();

  logger.info(`Set latestServerStartTime ${latestServerStartTime}`);
  const settingsResult = await saveSettings({ latestServerStartTime });
  if (isErrorResult(settingsResult)) {
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
  if (isErrorResult(latestServerStartResult)) {
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
  cronJobs.map((job) => {
    job.stop();
  });

  logger.info("CronJobs stopped");
};

export const autoUpdateProgramItems = async (): Promise<void> => {
  logger.info("----> Auto update program items");

  logger.info(
    `Check if latest running server instance with start time ${latestServerStartTime}`,
  );
  const latestServerResult = await isLatestStartedServerInstance(
    latestServerStartTime,
  );
  if (isErrorResult(latestServerResult)) {
    if (latestServerResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.error(
        "%s",
        new Error("Cronjobs: Newer server instance running, stop"),
      );
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Program items auto update failed trying to check latest server start time: ${latestServerResult.error}`,
      ),
    );
    return;
  }

  logger.info("Check if auto update already running...");
  const programUpdateLastRunResult = await setProgramUpdateLastRun(
    dayjs().toISOString(),
  );
  if (isErrorResult(programUpdateLastRunResult)) {
    if (programUpdateLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.error(
        "%s",
        new Error("Program auto update already running, stop"),
      );
      return;
    }
    logger.error(
      "%s",
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
      "%s",
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

  logger.info(
    `Check if latest running server instance with start time ${latestServerStartTime}`,
  );
  const latestServerResult = await isLatestStartedServerInstance(
    latestServerStartTime,
  );
  if (isErrorResult(latestServerResult)) {
    if (latestServerResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.error(
        "%s",
        new Error("Cronjobs: Newer server instance running, stop"),
      );
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Auto assignment failed trying to check latest server start time: ${latestServerResult.error}`,
      ),
    );
    return;
  }

  logger.info("Check if assignment already running...");
  const assignmentLastRunResult = await setAssignmentLastRun(
    dayjs().toISOString(),
  );
  if (isErrorResult(assignmentLastRunResult)) {
    if (assignmentLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.error("%s", new Error("Auto assignment already running, stop"));
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Auto assignment failed trying to set last run time: ${assignmentLastRunResult.error}`,
      ),
    );
    return;
  }

  logger.info("Auto assignment not running, continue");

  const runAssignmentResult = await runAssignment({
    assignmentAlgorithm: config.event().assignmentAlgorithm,
    useDynamicStartTime: true,
    assignmentDelay: autoAssignDelay,
  });
  if (isErrorResult(runAssignmentResult)) {
    logger.error("%s", new Error("***** Auto assignment failed"));
    return;
  }

  logger.info("***** Automatic attendee assignment completed");
};

const protectCallback = (job: Cron): void => {
  const timeNow = dayjs().toISOString();
  const startTime = dayjs(job.currentRun()).toISOString();
  logger.error(
    "%s",
    new Error(
      `Cronjob ${job.name} at ${timeNow} was blocked by call started at ${startTime}`,
    ),
  );
};

const errorHandler = (error: unknown, job: Cron): void => {
  logger.error(`Error while running cronJob ${job.name}: %s`, error);
};
