import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { findResults } from "server/features/results/resultsRepository";
import { findSignups } from "server/features/signup/signupRepository";
import { Signup } from "server/features/signup/signup.typings";

export const verifyResults = async (): Promise<void> => {
  logger.info(`Verify results and user entered games match`);

  let resultsCollection: ResultsCollectionEntry[];
  try {
    resultsCollection = await findResults();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let signups: Signup[];
  try {
    signups = await findSignups();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  logger.info("Verify all userResults have correct startTime");

  resultsCollection.map((result) => {
    result.results.map((userResult) => {
      if (
        dayjs(userResult.enteredGame.time).format() !==
        dayjs(result.startTime).format()
      ) {
        logger.error(
          `Invalid time for "${
            userResult.enteredGame.gameDetails.title
          }" - actual: ${dayjs(
            userResult.enteredGame.time
          ).format()}, expected: ${result.startTime}`
        );
      }
    });
  });

  logger.info("Check if user signups match userResults");

  signups.forEach((signup) => {
    if (!signup.userSignups.length) return;

    signup.userSignups.forEach((userSignup) => {
      const results = resultsCollection.find((result) =>
        dayjs(result.startTime).isSame(dayjs(userSignup.time))
      );

      if (!results) {
        throw new Error(
          `No saved results for starting time ${userSignup.time}`
        );
      }

      const matchingResult = results.results.find((userResult) => {
        if (!signup.game) {
          throw new Error(`Game details missing for signup`);
        }

        if (!userResult.enteredGame.gameDetails) {
          throw new Error(`Game details missing for result`);
        }

        if (
          signup.game.gameId === userResult.enteredGame.gameDetails.gameId &&
          userSignup.username === userResult.username
        ) {
          logger.debug(
            `Match for game "${signup.game.title}" and user "${userSignup.username}"`
          );
          return userResult;
        }
      });

      if (!matchingResult) {
        throw new Error(
          `No matching result for user "${userSignup.username}" and game "${signup.game.title}"`
        );
      }
    });
  });

  logger.info("Check if results match signups");

  resultsCollection.forEach((results) => {
    results.results.forEach((result) => {
      const foundSignup = signups.find(
        (signup) => signup.game.gameId === result.enteredGame.gameDetails.gameId
      );

      if (!foundSignup) {
        throw new Error(
          `No signup found for game ${result.enteredGame.gameDetails.title}`
        );
      }

      const foundUserSignup = foundSignup.userSignups.find(
        (userSignup) => userSignup.username === result.username
      );

      if (!foundUserSignup) {
        throw new Error(
          `No signup found for user "${result.username}" and result "${result.enteredGame.gameDetails.title}"`
        );
      }
    });
  });
};
