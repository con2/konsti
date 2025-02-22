import dayjs from "dayjs";
import { countBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, User } from "shared/types/models/user";
import { getMaximumNumberOfAttendeesByTime } from "./resultDataHelpers";
import { PriorityObject } from "server/types/commonTypes";
import { toPercent } from "server/features/statistics/statsUtil";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getProgramItemsByStartTime = (
  programItems: readonly ProgramItem[],
): Record<string, number> => {
  const programItemsByTime = countBy(programItems, "startTime");

  logger.info(
    `Number of program items for each start time: \n`,
    programItemsByTime,
  );
  return programItemsByTime;
};

const getUsersByProgramItems = (
  _users: readonly User[],
): Record<string, number> => {
  // TODO: Update to use signup collection
  // const directSignups = users.flatMap((user) => user.directSignups);
  const directSignups: Signup[] = [];
  const usersByProgramItems = countBy(
    directSignups,
    "programItem.programItemId",
  );
  return usersByProgramItems;
};

export const getNumberOfFullProgramItems = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  const usersByProgramItems = getUsersByProgramItems(users);

  let counter = 0;
  for (const programItem of programItems) {
    if (
      programItem.maxAttendance ===
      usersByProgramItems[programItem.programItemId]
    ) {
      counter++;
    }
  }

  logger.info(
    `Program items with maximum number of attendees: ${counter}/${
      programItems.length
    } (${toPercent(counter / programItems.length)}%)`,
  );
};

const getSignupsByStartTime = (
  users: readonly User[],
): Record<string, number> => {
  const userSignupCountsByTime: Record<string, number> = {};

  logger.warn(
    "Warning: Inaccurate because forming groups deletes lotterySignups",
  );

  for (const user of users) {
    let groupSize = 1;

    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial,
      ).length;
    }

    const lotterySignups = user.lotterySignups.reduce<Record<string, number>>(
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
  }

  // logger.info(`Total number of signups by time: \n`, userSignupCountsByTime)
  return userSignupCountsByTime;
};

export const getDemandByTime = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by time");
  const signupsByTime = getSignupsByStartTime(users);
  const maximumNumberOfAttendeesByTime =
    getMaximumNumberOfAttendeesByTime(programItems);

  for (const startTime in maximumNumberOfAttendeesByTime) {
    logger.info(
      // eslint-disable-next-line no-restricted-syntax -- We want to call format here
      `Demand for ${dayjs(startTime).tz(TIMEZONE).format("DD.M.YYYY HH:mm")}: ${
        signupsByTime[startTime]
      }/${maximumNumberOfAttendeesByTime[startTime]} (${toPercent(
        signupsByTime[startTime] / maximumNumberOfAttendeesByTime[startTime],
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

    for (const lotterySignup of user.lotterySignups) {
      const foundProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === lotterySignup.programItem.programItemId,
      );

      if (!foundProgramItem) {
        continue;
      }

      acc[foundProgramItem.title] = {
        first: acc[foundProgramItem.title].first,
        second: acc[foundProgramItem.title].second,
        third: acc[foundProgramItem.title].third,
      };

      switch (lotterySignup.priority) {
        case 1: {
          acc[foundProgramItem.title].first =
            acc[foundProgramItem.title].first + groupSize;
          break;
        }
        case 2: {
          acc[foundProgramItem.title].second =
            ++acc[foundProgramItem.title].second + groupSize;
          break;
        }
        case 3: {
          acc[foundProgramItem.title].third =
            ++acc[foundProgramItem.title].third + groupSize;
          break;
        }
      }
    }
    return acc;
  }, {});

  logger.info(JSON.stringify(lotterySignups, null, 2));
};
