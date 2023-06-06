import schedule from "node-schedule";
import { logger } from "server/utils/logger";
import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { config } from "server/config";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import { isErrorResult, unwrapResult } from "shared/utils/result";

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
    const kompassiGamesResult = await getGamesFromKompassi();
    if (isErrorResult(kompassiGamesResult)) {
      logger.error(
        "***** Games auto update failed: error downloading games from Kompassi"
      );
      return;
    }
    const kompassiGames = unwrapResult(kompassiGamesResult);
    const saveGamesResult = await saveGames(kompassiGameMapper(kompassiGames));
    if (isErrorResult(saveGamesResult)) {
      logger.error("***** Games auto update failed: Error saving games");
      return;
    }
    logger.info("***** Games auto update completed");
  }

  // TODO: If program auto update fails, popularity update is skipped

  if (autoUpdateGamePopularityEnabled) {
    logger.info("----> Auto update game popularity");
    const updateGamePopularityResult = await updateGamePopularity();
    if (isErrorResult(updateGamePopularityResult)) {
      logger.error("***** Game popularity auto update failed");
      return;
    }
    logger.info("***** Game popularity auto update completed");
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
