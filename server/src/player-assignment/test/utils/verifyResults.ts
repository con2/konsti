import moment from 'moment';
import { db } from 'db/mongodb';
import { logger } from 'utils/logger';
import { User } from 'typings/user.typings';
import { ResultsCollectionEntry } from 'typings/result.typings';

export const verifyResults = async (): Promise<void> => {
  logger.info(`Verify results and user entered games match`);

  let resultsCollection: ResultsCollectionEntry[];
  try {
    resultsCollection = await db.results.findResults();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  let users: User[];
  try {
    users = await db.user.findUsers();
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
