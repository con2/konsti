import schedule from "node-schedule";
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

const { assignmentStrategy } = sharedConfig;

export const startCronJobs = (): void => {
  if (autoUpdateGamesEnabled) {
    schedule.scheduleJob(gameUpdateInterval, autoUpdateGames);
  }

  if (autoAssignPlayersEnabled) {
    schedule.scheduleJob(autoAssignInterval, autoAssignPlayers);
  }
};

export const stopCronJobs = (): void => {
  const jobList = schedule.scheduledJobs;

  Object.values(jobList).map((job) => {
    schedule.cancelJob(job.name);
  });

  logger.info("CronJobs stopped");
};

const autoUpdateGames = async (): Promise<void> => {
  if (autoUpdateGamesEnabled) {
    logger.info("----> Auto update games");
    const updateGamesResult = await updateGames();
    if (updateGamesResult.status === "error") {
      logger.error(
        `***** Games auto update failed: ${updateGamesResult.message}`
      );
      return;
    }
    logger.info("***** Games auto update completed");
  }
};

const autoAssignPlayers = async (): Promise<void> => {
  logger.info("----> Auto assign players");

  const runAssignmentResult = await runAssignment({
    assignmentStrategy,
    useDynamicStartingTime: true,
    assignmentDelay: autoAssignDelay,
  });
  if (isErrorResult(runAssignmentResult)) {
    logger.error("***** Auto assignment failed");
    return;
  }

  logger.info("***** Automatic player assignment completed");
};
