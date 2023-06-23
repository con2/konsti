import { Cron } from "croner";
import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { config } from "server/config";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { sharedConfig } from "shared/config/sharedConfig";
import { isErrorResult } from "shared/utils/result";
import { updateGames } from "server/features/game/gamesService";

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
  const timeNow = dayjs().format();
  const startTime = dayjs(job.currentRun()).format();
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
