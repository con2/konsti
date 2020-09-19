import moment from 'moment';
import schedule from 'node-schedule';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { updateGames } from 'api/controllers/gamesController';
import { config } from 'config';
import { updateGamePopularity } from 'game-popularity/updateGamePopularity';
import { removeOverlapSignups } from 'player-assignment/utils/removeOverlapSignups';
import { runAssignment } from 'player-assignment/runAssignment';
import { saveResults } from 'player-assignment/utils/saveResults';
import { sleep } from 'utils/sleep';
import { kompassiGameMapper } from 'utils/kompassiGameMapper';

const {
  autoUpdateGamesEnabled,
  gameUpdateInterval,
  autoUpdateGamePopularityEnabled,
  autoAssignPlayersEnabled,
} = config;

export const autoUpdateGames = async (): Promise<void> => {
  if (!autoUpdateGamesEnabled || !autoUpdateGamePopularityEnabled) return;

  const cronRule = `*/${gameUpdateInterval} * * * *`;

  const callback = async (): Promise<void> => {
    if (autoUpdateGamesEnabled) {
      logger.info('----> Auto update games');
      const kompassiGames = await updateGames();
      await db.game.saveGames(kompassiGameMapper(kompassiGames));
      logger.info('***** Games auto update completed');
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
      assignResults = await runAssignment(startTime);
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
      await db.settings.saveSignupTime(startTime);
    } catch (error) {
      logger.error(`db.settings.saveSignupTime error: ${error}`);
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
