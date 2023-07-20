import { Cron } from "croner";
import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { config } from "server/config";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { sharedConfig } from "shared/config/sharedConfig";
import { isErrorResult } from "shared/utils/result";
import { updateGames } from "server/features/game/gamesService";
import {
  setAssignmentLastRun,
  setProgramUpdateLastRun,
} from "server/features/settings/settingsRepository";
import { MongoDbError } from "shared/typings/api/errors";

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoAssignPlayersEnabled,
  autoAssignDelay,
  autoAssignInterval,
} = config;

const cronJobs: Cron[] = [];

export const startCronJobs = (): void => {
  if (autoUpdateGamesEnabled) {
    logger.info("Start cronjob: program auto update");

    const autoUpdateGamesJob = Cron(
      gameUpdateInterval,
      {
        name: "autoUpdateGames",
        protect: protectCallback,
        catch: errorHandler,
      },
      autoUpdateGames
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
      autoAssignPlayers
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

  logger.info("Check if auto update already running...");
  const programUpdateLastRunResult = await setProgramUpdateLastRun(
    dayjs().toISOString()
  );
  if (isErrorResult(programUpdateLastRunResult)) {
    if (programUpdateLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.info("Auto update already running, stop");
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Games auto update failed trying to set last run time: ${programUpdateLastRunResult.error}`
      )
    );
  }

  logger.info("Auto update not running, continue");

  const updateGamesResult = await updateGames();
  if (updateGamesResult.status === "error") {
    logger.error(
      "%s",
      new Error(`***** Games auto update failed: ${updateGamesResult.message}`)
    );
    return;
  }

  logger.info("***** Games auto update completed");
};

export const autoAssignPlayers = async (): Promise<void> => {
  logger.info("----> Auto assign players");

  logger.info("Check if assignment already running...");
  const assignmentLastRunResult = await setAssignmentLastRun(
    dayjs().toISOString()
  );
  if (isErrorResult(assignmentLastRunResult)) {
    if (assignmentLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
      logger.info("Assignment already running, stop");
      return;
    }
    logger.error(
      "%s",
      new Error(
        `***** Auto assignment failed trying to set last run time: ${assignmentLastRunResult.error}`
      )
    );
  }

  logger.info("Assignment not running, continue");

  const runAssignmentResult = await runAssignment({
    assignmentStrategy: sharedConfig.assignmentStrategy,
    useDynamicStartingTime: true,
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
      `Cronjob ${job.name} at ${timeNow} was blocked by call started at ${startTime}`
    )
  );
};

const errorHandler = (error: unknown, job: Cron): void => {
  logger.error(`Error while running cronJob ${job.name}: %s`, error);
};
