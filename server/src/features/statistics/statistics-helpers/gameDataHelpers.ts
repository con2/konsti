import dayjs from "dayjs";
import { countBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, User } from "shared/types/models/user";
import { getMaximumNumberOfPlayersByTime } from "./resultDataHelpers";
import { StringNumberObject, PriorityObject } from "server/types/commonTypes";
import { toPercent } from "server/features/statistics/statsUtil";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getGamesByStartTime = (
  games: readonly ProgramItem[],
): StringNumberObject => {
  const gamesByTime = countBy(games, "startTime");

  logger.info(`Number of games for each start time: \n`, gamesByTime);
  return gamesByTime;
};

const getUsersByGames = (_users: readonly User[]): StringNumberObject => {
  // TODO: Update to use signup collection
  // const directSignups = users.flatMap((user) => user.directSignups);
  const directSignups: Signup[] = [];
  const usersByGames = countBy(directSignups, "gameDetails.gameId");
  return usersByGames;
};

export const getNumberOfFullGames = (
  games: readonly ProgramItem[],
  users: readonly User[],
): void => {
  const usersByGames = getUsersByGames(users);

  let counter = 0;
  games.forEach((game) => {
    if (game.maxAttendance === usersByGames[game.gameId]) {
      counter++;
    }
  });

  logger.info(
    `Games with maximum number of players: ${counter}/${
      games.length
    } (${toPercent(counter / games.length)}%)`,
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
  games: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by time");
  const signupsByTime = getSignupsByStartTime(users);
  const maximumNumberOfPlayersByTime = getMaximumNumberOfPlayersByTime(games);

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

export const getDemandByGame = (
  games: readonly ProgramItem[],
  users: readonly User[],
): void => {
  logger.info(">>> Demand by games");

  const lotterySignups = users.reduce<PriorityObject>((acc, user) => {
    let groupSize = 1;
    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial,
      ).length;
    }

    user.lotterySignups.forEach((lotterySignup) => {
      const foundGame = games.find(
        (game) => game.gameId === lotterySignup.gameDetails.gameId,
      );

      if (!foundGame) {
        return;
      }

      acc[foundGame.title] = {
        first: acc[foundGame.title].first ? acc[foundGame.title].first : 0,
        second: acc[foundGame.title].second ? acc[foundGame.title].second : 0,
        third: acc[foundGame.title].third ? acc[foundGame.title].third : 0,
      };

      if (lotterySignup.priority === 1) {
        acc[foundGame.title].first = acc[foundGame.title].first + groupSize;
      } else if (lotterySignup.priority === 2) {
        acc[foundGame.title].second = ++acc[foundGame.title].second + groupSize;
      } else if (lotterySignup.priority === 3) {
        acc[foundGame.title].third = ++acc[foundGame.title].third + groupSize;
      }
    });
    return acc;
  }, {});

  logger.info(JSON.stringify(lotterySignups, null, 2));
};
