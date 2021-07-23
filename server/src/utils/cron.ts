import moment from 'moment';
import schedule from 'node-schedule';
import { logger } from 'server/utils/logger';
import { updateGames } from 'server/utils/updateGames';
import { config } from 'server/config';
import { updateGamePopularity } from 'server/features/game-popularity/updateGamePopularity';
import { removeOverlapSignups } from 'server/features/player-assignment/utils/removeOverlapSignups';
import { runAssignment } from 'server/features/player-assignment/runAssignment';
import { saveResults } from 'server/features/player-assignment/utils/saveResults';
import { sleep } from 'server/utils/sleep';
import { kompassiGameMapper } from 'server/utils/kompassiGameMapper';
import { saveSignupTime } from 'server/features/settings/settingsRepository';
import { saveGames } from 'server/features/game/gameRepository';
import { sharedConfig } from 'shared/config/sharedConfig';

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoUpdateGamePopularityEnabled,
  autoAssignPlayersEnabled,
} = config;

export const autoUpdateGames = async (): Promise<void> => {
  if (!autoUpdateGamesEnabled && !autoUpdateGamePopularityEnabled) return;

  const cronRule = `*/${gameUpdateInterval} * * * *`;

  const callback = async (): Promise<void> => {
    if (autoUpdateGamesEnabled) {
      logger.info('----> Auto update games');
      try {
        const kompassiGames = await updateGames();
        await saveGames(kompassiGameMapper(kompassiGames));
        logger.info('***** Games auto update completed');
      } catch (error) {
        logger.error(`autoUpdateGames() failed: ${error}`);
      }
    }

    if (autoUpdateGamePopularityEnabled) {
      logger.info('----> Auto update game popularity');
      await updateGamePopularity();
      logger.info('***** Game popularity auto update completed');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  await schedule.scheduleJob(cronRule, callback);
};

export const autoAssignPlayers = async (): Promise<void> => {
  if (!autoAssignPlayersEnabled) return;

  const cronRule = `30 * * * *`;

  const callback = async (): Promise<void> => {
    logger.info('----> Auto assign players');
    // 30 * * * * -> “At minute 30.”
    // */1 * * * * -> “Every minute”

    const startTime = moment().endOf('hour').add(1, 'seconds').format();

    /*
    const startTime = moment(config.CONVENTION_START_TIME)
      .add(2, 'hours')
      .format();
    */

    // Wait for final signup requests
    logger.info('Wait 10s for final requests');
    await sleep(10000);

    logger.info('Waiting done, start assignment');

    let assignResults;
    try {
      assignResults = await runAssignment(
        startTime,
        sharedConfig.assignmentStrategy
      );
    } catch (error) {
      logger.error(error);
    }

    // console.log('>>> assignResults: ', assignResults)

    if (assignResults?.results.length === 0) return;

    // Save results
    try {
      await saveResults(
        assignResults ? assignResults.results : [],
        startTime,
        assignResults ? assignResults.algorithm : '',
        assignResults ? assignResults.message : ''
      );
    } catch (error) {
      logger.error(`saveResult error: ${error}`);
    }

    // Set which results are shown
    try {
      await saveSignupTime(startTime);
    } catch (error) {
      logger.error(`saveSignupTime error: ${error}`);
    }

    // Remove overlapping signups
    if (config.enableRemoveOverlapSignups) {
      logger.info('Remove overlapping signups');

      if (assignResults) {
        try {
          await removeOverlapSignups(assignResults.results);
        } catch (error) {
          logger.error(`removeOverlapSignups error: ${error}`);
        }
      }
    }

    logger.info('***** Automatic player assignment completed');
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  await schedule.scheduleJob(cronRule, callback);
};
