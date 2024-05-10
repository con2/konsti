import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
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
    `Number of people entering to program items by start times: \n`,
    signupsByTime,
  );

  return signupsByTime;
};

export const getMaximumNumberOfPlayersByTime = (
  programItems: readonly ProgramItem[],
): StringNumberObject => {
  const maxNumberOfPlayersByTime: StringNumberObject = {};

  programItems.forEach((programItem) => {
    if (!maxNumberOfPlayersByTime[programItem.startTime]) {
      maxNumberOfPlayersByTime[programItem.startTime] = 0;
    }

    maxNumberOfPlayersByTime[programItem.startTime] =
      maxNumberOfPlayersByTime[programItem.startTime] +
      programItem.maxAttendance;
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
