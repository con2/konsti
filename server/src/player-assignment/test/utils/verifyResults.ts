import moment from 'moment';
import { logger } from 'server/utils/logger';
import { User } from 'server/typings/user.typings';
import { ResultsCollectionEntry } from 'server/typings/result.typings';
import { findUsers } from 'server/db/user/userService';
import { findResults } from 'server/db/results/resultsService';

export const verifyResults = async (): Promise<void> => {
  logger.info(`Verify results and user entered games match`);

  let resultsCollection: ResultsCollectionEntry[];
  try {
    resultsCollection = await findResults();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  let users: User[];
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  logger.info('Verify all userResults have correct startTime');

  resultsCollection.map((result) => {
    result.results.map((userResult) => {
      if (
        moment(userResult.enteredGame.time).format() !==
        moment(result.startTime).format()
      ) {
        logger.error(
          `Invalid time for "${
            userResult.enteredGame.gameDetails.title
          }" - actual: ${moment(
            userResult.enteredGame.time
          ).format()}, expected: ${result.startTime}`
        );
      }
    });
  });

  logger.info('Check if user enteredGames match userResults');

  users.forEach((user) => {
    if (!user.enteredGames.length) return;

    user.enteredGames.forEach((enteredGame) => {
      const results = resultsCollection.find((result) =>
        moment(result.startTime).isSame(moment(enteredGame.time))
      );

      if (!results) {
        logger.error(`No saved results for starting time ${enteredGame.time}`);
        return;
      }

      const matchingResult = results.results.find((userResult) => {
        if (!enteredGame.gameDetails) {
          logger.error(`Game details missing for entered game`);
          return;
        }

        if (!userResult.enteredGame.gameDetails) {
          logger.error(`Game details missing for result`);
          return;
        }

        if (
          enteredGame.gameDetails.gameId ===
            userResult.enteredGame.gameDetails.gameId &&
          user.username === userResult.username
        ) {
          logger.debug(
            `Match for game "${enteredGame.gameDetails.title}" and user "${user.username}"`
          );
          return userResult;
        }
      });

      if (!matchingResult) {
        logger.error(
          `No matching result for user "${user.username}" and game "${enteredGame.gameDetails.title}"`
        );
      }
    });
  });

  logger.info('Check if results match user enteredGames');

  resultsCollection.forEach((results) => {
    results.results.forEach((result) => {
      const user = users.find((user) => user.username === result.username);

      if (!user) {
        logger.error('No user found for result');
        return;
      }

      const gameFound = user.enteredGames.find(
        (enteredGame) =>
          enteredGame.gameDetails.gameId ===
          result.enteredGame.gameDetails.gameId
      );

      if (!gameFound) {
        logger.error(
          `No entered game found for user "${user.username}" and result "${result.enteredGame.gameDetails?.title}"`
        );
      }
    });
  });
};
