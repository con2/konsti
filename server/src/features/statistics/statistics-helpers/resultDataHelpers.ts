import { logger } from "server/utils/logger";
import { Game } from "shared/types/models/game";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { StringNumberObject } from "server/types/commonTypes";
import { toPercent } from "server/features/statistics/statsUtil";

export const getSignupsByTime = (
  results: readonly ResultsCollectionEntry[],
): StringNumberObject => {
  const signupsByTime = results.reduce<StringNumberObject>((acc, result) => {
    acc[result.startTime] = result.results.length;
    return acc;
  }, {});

  logger.debug(
    `Number of people entering to games by start times: \n`,
    signupsByTime,
  );

  return signupsByTime;
};

export const getMaximumNumberOfPlayersByTime = (
  games: readonly Game[],
): StringNumberObject => {
  const maxNumberOfPlayersByTime: StringNumberObject = {};

  games.forEach((game) => {
    if (!maxNumberOfPlayersByTime[game.startTime]) {
      maxNumberOfPlayersByTime[game.startTime] = 0;
    }

    maxNumberOfPlayersByTime[game.startTime] =
      maxNumberOfPlayersByTime[game.startTime] + game.maxAttendance;
  });

  logger.debug(
    `Maximum number of seats by start times: \n`,
    maxNumberOfPlayersByTime,
  );

  return maxNumberOfPlayersByTime;
};

export const getDemandByTime = (
  signupsByTime: StringNumberObject,
  maximumNumberOfPlayersByTime: StringNumberObject,
): void => {
  logger.info("Sanity check: values over 100% are anomalies");
  for (const startTime in maximumNumberOfPlayersByTime) {
    logger.info(
      `Signed people for ${startTime}: ${signupsByTime[startTime]}/${
        maximumNumberOfPlayersByTime[startTime]
      } (${toPercent(
        signupsByTime[startTime] / maximumNumberOfPlayersByTime[startTime],
      )}%)`,
    );
  }
};
