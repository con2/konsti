import schedule from "node-schedule";
import { logger } from "server/utils/logger";
import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { config } from "server/config";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoUpdateGamePopularityEnabled,
  autoAssignPlayersEnabled,
  autoAssignDelay,
  autoAssignInterval,
} = config;

const { assignmentStrategy } = sharedConfig;

export const startCronJobs = async (): Promise<void> => {
  if (autoUpdateGamesEnabled || autoUpdateGamePopularityEnabled) {
    await schedule.scheduleJob(gameUpdateInterval, autoUpdateGames);
  }

  if (autoAssignPlayersEnabled) {
    await schedule.scheduleJob(autoAssignInterval, autoAssignPlayers);
  }
};

const autoUpdateGames = async (): Promise<void> => {
  if (autoUpdateGamesEnabled) {
    logger.info("----> Auto update games");
    try {
      const kompassiGames = await getGamesFromKompassi();
      await saveGames(kompassiGameMapper(kompassiGames));
      logger.info("***** Games auto update completed");
    } catch (error) {
      logger.error(`Games auto update failed: ${error}`);
    }
  }

  if (autoUpdateGamePopularityEnabled) {
    logger.info("----> Auto update game popularity");
    try {
      await updateGamePopularity();
    } catch (error) {
      logger.error(`Game popularity auto update failed: ${error}`);
    }
    logger.info("***** Game popularity auto update completed");
  }
};

const autoAssignPlayers = async (): Promise<void> => {
  logger.info("----> Auto assign players");

  try {
    await runAssignment({
      assignmentStrategy,
      useDynamicStartingTime: true,
      assignmentDelay: autoAssignDelay,
    });
  } catch (error) {
    logger.error(`Auto assignment failed: ${error}`);
    return;
  }

  logger.info("***** Automatic player assignment completed");
};
