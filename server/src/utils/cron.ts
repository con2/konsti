import moment from "moment";
import schedule from "node-schedule";
import { logger } from "server/utils/logger";
import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { config } from "server/config";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { sleep } from "server/utils/sleep";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import { saveSettings } from "server/features/settings/settingsRepository";

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoUpdateGamePopularityEnabled,
  autoAssignPlayersEnabled,
} = config;

const { assignmentStrategy } = sharedConfig;

export const startCronJobs = async (): Promise<void> => {
  if (autoUpdateGamesEnabled || autoUpdateGamePopularityEnabled) {
    const gameUpdatecronRule = `*/${gameUpdateInterval} * * * *`;
    await schedule.scheduleJob(gameUpdatecronRule, autoUpdateGames);
  }

  if (autoAssignPlayersEnabled) {
    const autoAssingCronRule = `*/30 * * * *`;
    await schedule.scheduleJob(autoAssingCronRule, autoAssignPlayers);
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

  const startTime = moment().endOf("hour").add(1, "seconds").format();

  logger.info("Auto assign: Wait 10s for final requests");
  await sleep(10000);
  logger.info("Auto assign: Waiting done, start assignment");

  let assignResults;
  try {
    assignResults = await runAssignment(startTime, assignmentStrategy);
    if (assignResults.results.length === 0) {
      // throw new Error("No results");
    }
  } catch (error) {
    logger.error(`Auto assignment failed: ${error}`);
    return;
  }

  // Save results
  try {
    await saveResults({
      results: assignResults.results,
      startingTime: startTime,
      algorithm: assignResults.algorithm,
      message: assignResults.message,
    });
  } catch (error) {
    logger.error(`Auto assign: saving results failed: ${error}`);
  }

  // Set which results are shown
  try {
    await saveSettings({ signupTime: startTime });
  } catch (error) {
    logger.error(
      `Auto assign: saving time for visible results failed: ${error}`
    );
  }

  // Remove overlapping signups
  if (config.enableRemoveOverlapSignups) {
    logger.info("Auto assign: Remove overlapping signups");

    if (assignResults) {
      try {
        await removeOverlapSignups(assignResults.results);
      } catch (error) {
        logger.error(
          `Auto assign: removing overlapping sigups failed: ${error}`
        );
      }
    }
  }

  logger.info("***** Automatic player assignment completed");
};
