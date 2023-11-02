import { Cron } from "croner";
import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { updateGames } from "server/features/game/gamesService";
import {
  isLatestStartedServerInstance,
  saveSettings,
  setAssignmentLastRun,
  setProgramUpdateLastRun,
} from "server/features/settings/settingsRepository";
import { MongoDbError } from "shared/typings/api/errors";

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

  return makeSuccessResult(undefined);
};

export const startCronJobs = async (): Promise<void> => {
  const {
    autoUpdateGamesEnabled,
    gameUpdateInterval,
    autoAssignPlayersEnabled,
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

  if (autoUpdateGamesEnabled) {
    logger.info("Start cronjob: program auto update");

    const autoUpdateGamesJob = Cron(
      gameUpdateInterval,
      {
        name: "autoUpdateGames",
        protect: protectCallback,
        catch: errorHandler,
      },
      autoUpdateGames,
    );
    cronJobs.push(autoUpdateGamesJob);
  }

  if (autoAssignPlayersEnabled) {
    logger.info("Start cronjob: automatic player assignment");

    const autoAssignPlayersJob = Cron(
      autoAssignInterval,
      {
        name: "autoAssignPlayers",
        protect: protectCallback,
        catch: errorHandler,
      },
      autoAssignPlayers,
    );
    cronJobs.push(autoAssignPlayersJob);
  }
};

export const stopCronJobs = (): void => {
  cronJobs.map((job) => {
    job.stop();
  });

  logger.info("CronJobs stopped");
};

export const autoUpdateGames = async (): Promise<void> => {
  logger.info("----> Auto update games");

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
        new Error(`Cronjobs: Newer server instance running, stop`),
      );
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Games auto update failed trying to check latest server start time: ${latestServerResult.error}`,
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
        `***** Games auto update failed trying to set last run time: ${programUpdateLastRunResult.error}`,
      ),
    );
    return;
  }

  logger.info("Auto update not running, continue");

  const updateGamesResult = await updateGames();
  if (updateGamesResult.status === "error") {
    logger.error(
      "%s",
      new Error(`***** Games auto update failed: ${updateGamesResult.message}`),
    );
    return;
  }

  logger.info("***** Games auto update completed");
};

export const autoAssignPlayers = async (): Promise<void> => {
  const { autoAssignDelay } = config.server();

  logger.info("----> Auto assign players");

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
        new Error(`Cronjobs: Newer server instance running, stop`),
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
    assignmentStrategy: config.shared().assignmentStrategy,
    useDynamicStartTime: true,
    assignmentDelay: autoAssignDelay,
  });
  if (isErrorResult(runAssignmentResult)) {
    logger.error("%s", new Error("***** Auto assignment failed"));
    return;
  }

  logger.info("***** Automatic player assignment completed");
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
