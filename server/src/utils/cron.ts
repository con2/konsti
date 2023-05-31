import schedule from "node-schedule";
import { logger } from "server/utils/logger";
import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { config } from "server/config";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoUpdateGamePopularityEnabled,
  autoAssignPlayersEnabled,
  autoAssignDelay,
  autoAssignInterval,
} = config;

const { assignmentStrategy } = sharedConfig;

export const startCronJobs = (): void => {
  if (autoUpdateGamesEnabled || autoUpdateGamePopularityEnabled) {
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
    const kompassiGamesAsyncResult = await getGamesFromKompassi();
    if (isErrorResult(kompassiGamesAsyncResult)) {
      logger.error(
        "***** Games auto update failed: error downloading games from Kompassi"
      );
      return;
    }
    const kompassiGames = unwrapResult(kompassiGamesAsyncResult);
    const saveGamesAsyncResult = await saveGames(
      kompassiGameMapper(kompassiGames)
    );
    if (isErrorResult(saveGamesAsyncResult)) {
      logger.error("***** Games auto update failed: Error saving games");
      return;
    }
    logger.info("***** Games auto update completed");
  }

  if (autoUpdateGamePopularityEnabled) {
    logger.info("----> Auto update game popularity");
    const updateGamePopularityAsyncResult = await updateGamePopularity();
    if (isErrorResult(updateGamePopularityAsyncResult)) {
      logger.error("***** Game popularity auto update failed");
      return;
    }
    logger.info("***** Game popularity auto update completed");
  }
};

const autoAssignPlayers = async (): Promise<void> => {
  logger.info("----> Auto assign players");

  const runAssignmentAsyncResult = await runAssignment({
    assignmentStrategy,
    useDynamicStartingTime: true,
    assignmentDelay: autoAssignDelay,
  });
  if (isErrorResult(runAssignmentAsyncResult)) {
    logger.error("***** Auto assignment failed");
    return;
  }

  logger.info("***** Automatic player assignment completed");
};
