import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { toPercent } from "server/features/statistics/statsUtil";

export const getSignupsByTime = (
  results: readonly ResultsCollectionEntry[],
): Record<string, number> => {
  const signupsByTime = results.reduce<Record<string, number>>(
    (acc, result) => {
      acc[result.assignmentTime] = result.results.length;
      return acc;
    },
    {},
  );

  logger.debug(
    "Number of people entering to program items by start times: \n",
    signupsByTime,
  );

  return signupsByTime;
};

export const getMaximumNumberOfAttendeesByTime = (
  programItems: readonly ProgramItem[],
): Record<string, number> => {
  const maxNumberOfAttendeesByTime: Record<string, number> = {};

  for (const programItem of programItems) {
    if (!maxNumberOfAttendeesByTime[programItem.startTime]) {
      maxNumberOfAttendeesByTime[programItem.startTime] = 0;
    }

    maxNumberOfAttendeesByTime[programItem.startTime] =
      maxNumberOfAttendeesByTime[programItem.startTime] +
      programItem.maxAttendance;
  }

  logger.debug(
    "Maximum number of seats by start times: \n",
    maxNumberOfAttendeesByTime,
  );

  return maxNumberOfAttendeesByTime;
};

export const getDemandByTime = (
  signupsByTime: Record<string, number>,
  maximumNumberOfAttendeesByTime: Record<string, number>,
): void => {
  logger.info("Sanity check: values over 100% are anomalies");
  for (const startTime in maximumNumberOfAttendeesByTime) {
    logger.info(
      `Signed people for ${startTime}: ${signupsByTime[startTime]}/${
        maximumNumberOfAttendeesByTime[startTime]
      } (${toPercent(
        signupsByTime[startTime] / maximumNumberOfAttendeesByTime[startTime],
      )}%)`,
    );
  }
};
