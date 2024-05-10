import dayjs from "dayjs";
import { countBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, User } from "shared/types/models/user";
import { getMaximumNumberOfPlayersByTime } from "./resultDataHelpers";
import { StringNumberObject, PriorityObject } from "server/types/commonTypes";
import { toPercent } from "server/features/statistics/statsUtil";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getProgramItemsByStartTime = (
  programItems: readonly ProgramItem[],
): StringNumberObject => {
  const programItemsByTime = countBy(programItems, "startTime");

  logger.info(
    `Number of program items for each start time: \n`,
    programItemsByTime,
  );
  return programItemsByTime;
};

const getUsersByProgramItems = (
  _users: readonly User[],
): StringNumberObject => {
  // TODO: Update to use signup collection
  // const directSignups = users.flatMap((user) => user.directSignups);
  const directSignups: Signup[] = [];
  const usersByProgramItems = countBy(
    directSignups,
    "programItemDetails.programItemId",
  );
  return usersByProgramItems;
};

export const getNumberOfFullProgramItems = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  const usersByProgramItems = getUsersByProgramItems(users);

  let counter = 0;
  programItems.forEach((programItem) => {
    if (
      programItem.maxAttendance ===
      usersByProgramItems[programItem.programItemId]
    ) {
      counter++;
    }
  });

  logger.info(
    `Program items with maximum number of players: ${counter}/${
      programItems.length
    } (${toPercent(counter / programItems.length)}%)`,
  );
};

const getSignupsByStartTime = (users: readonly User[]): StringNumberObject => {
  const userSignupCountsByTime: StringNumberObject = {};

  logger.warn(
    "Warning: Inaccurate because forming groups deletes lotterySignups",
  );

  users.forEach((user) => {
    let groupSize = 1;

    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial,
      ).length;
    }

    const lotterySignups = user.lotterySignups.reduce<StringNumberObject>(
      (acc, lotterySignup) => {
        acc[lotterySignup.time] = acc[lotterySignup.time] + 1 || 1;
        return acc;
      },
      {},
    );

    for (const lotterySignup in lotterySignups) {
      userSignupCountsByTime[lotterySignup] =
        userSignupCountsByTime[lotterySignup] + groupSize || groupSize;
    }
  });

  // logger.info(`Total number of signups by time: \n`, userSignupCountsByTime)
  return userSignupCountsByTime;
};

export const getDemandByTime = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by time");
  const signupsByTime = getSignupsByStartTime(users);
  const maximumNumberOfPlayersByTime =
    getMaximumNumberOfPlayersByTime(programItems);

  for (const startTime in maximumNumberOfPlayersByTime) {
    logger.info(
      // eslint-disable-next-line no-restricted-syntax -- We want to call format here
      `Demand for ${dayjs(startTime).tz(TIMEZONE).format("DD.M.YYYY HH:mm")}: ${
        signupsByTime[startTime]
      }/${maximumNumberOfPlayersByTime[startTime]} (${toPercent(
        signupsByTime[startTime] / maximumNumberOfPlayersByTime[startTime],
      )}%)`,
    );
  }
};

export const getDemandByProgramItem = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by program items");

  const lotterySignups = users.reduce<PriorityObject>((acc, user) => {
    let groupSize = 1;
    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial,
      ).length;
    }

    user.lotterySignups.forEach((lotterySignup) => {
      const foundProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId ===
          lotterySignup.programItemDetails.programItemId,
      );

      if (!foundProgramItem) {
        return;
      }

      acc[foundProgramItem.title] = {
        first: acc[foundProgramItem.title].first
          ? acc[foundProgramItem.title].first
          : 0,
        second: acc[foundProgramItem.title].second
          ? acc[foundProgramItem.title].second
          : 0,
        third: acc[foundProgramItem.title].third
          ? acc[foundProgramItem.title].third
          : 0,
      };

      if (lotterySignup.priority === 1) {
        acc[foundProgramItem.title].first =
          acc[foundProgramItem.title].first + groupSize;
      } else if (lotterySignup.priority === 2) {
        acc[foundProgramItem.title].second =
          ++acc[foundProgramItem.title].second + groupSize;
      } else if (lotterySignup.priority === 3) {
        acc[foundProgramItem.title].third =
          ++acc[foundProgramItem.title].third + groupSize;
      }
    });
    return acc;
  }, {});

  logger.info(JSON.stringify(lotterySignups, null, 2));
};
