import dayjs from "dayjs";
import { countBy } from "remeda";
import { logger } from "server/utils/logger";
import { ProgramItem, ProgramType } from "shared/types/models/programItem";
import { DirectSignup, User } from "shared/types/models/user";
import { getMaximumNumberOfAttendeesByTime } from "./resultDataHelpers";
import { toPercent } from "server/features/statistics/statsUtil";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getProgramItemsByStartTime = (
  programItems: readonly ProgramItem[],
): Record<string, number> => {
  const programItemsByTime = countBy(
    programItems,
    (programItem) => programItem.startTime,
  );

  logger.info(
    "Number of program items for each start time: \n",
    programItemsByTime,
  );
  return programItemsByTime;
};

const getUsersByProgramItems = (
  _users: readonly User[],
): Record<string, number> => {
  // TODO: Update to use signup collection
  // const directSignups = users.flatMap((user) => user.directSignups);
  const directSignups: DirectSignup[] = [];
  const usersByProgramItems = countBy(
    directSignups,
    (directSignup) => directSignup.programItemId,
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
        acc[lotterySignup.signedToStartTime] =
          acc[lotterySignup.signedToStartTime] + 1 || 1;
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

interface SignupTally {
  programItemId: string;
  title: string;
  programType: ProgramType;
  gameSystem: string;
  startTime: string;
  maxAttendance: number;
  total: number;
  byPriority: Record<number, number>;
}

// Aggregate lottery signups and return top program items
const getTopProgramItems = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  limit?: number,
): SignupTally[] => {
  const programItemById = new Map(
    programItems.map((pi) => [pi.programItemId, pi]),
  );
  const tally = new Map<string, SignupTally>();

  for (const user of users) {
    for (const lotterySignup of user.lotterySignups) {
      const programItemId = lotterySignup.programItemId;
      let entry = tally.get(programItemId);
      if (!entry) {
        const programItem = programItemById.get(programItemId);
        if (!programItem) {
          continue;
        }
        entry = {
          programItemId,
          title: programItem.title,
          programType: programItem.programType,
          gameSystem: programItem.gameSystem,
          startTime: programItem.startTime,
          maxAttendance: programItem.maxAttendance,
          total: 0,
          byPriority: { 1: 0, 2: 0, 3: 0 },
        };
        tally.set(programItemId, entry);
      }
      entry.total += 1;
      const p = lotterySignup.priority;
      entry.byPriority[p] += 1;
    }
  }

  const results = [...tally.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total; // primary: total
    if (b.byPriority[1] !== a.byPriority[1])
      return b.byPriority[1] - a.byPriority[1]; // tie: more priority1
    if (b.byPriority[2] !== a.byPriority[2])
      return b.byPriority[2] - a.byPriority[2]; // then priority2
    return a.programItemId.localeCompare(b.programItemId); // stable final tie-break
  });

  return limit ? results.slice(0, limit) : results;
};

export const getDemandByProgramItem = (
  programItems: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by program items");

  const top = getTopProgramItems(users, programItems, 20);

  const output = top.map((t) => ({
    // id: t.programItemId,
    title: t.title,
    total: t.total,
    programType: t.programType,
    gameSystem: t.gameSystem,
    // eslint-disable-next-line no-restricted-syntax
    startTime: dayjs(t.startTime).format("ddd D.M.YYYY HH:mm"),
    maxAttendance: t.maxAttendance,
    percentAttended: `${((t.maxAttendance / t.total) * 100).toFixed(2)}%`,
    priority1: t.byPriority[1],
    priority2: t.byPriority[2],
    priority3: t.byPriority[3],
  }));

  logger.info(JSON.stringify(output, null, 2));
};
