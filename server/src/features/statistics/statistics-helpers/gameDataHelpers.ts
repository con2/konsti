import dayjs from "dayjs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { SelectedGame, User } from "shared/typings/models/user";
import { getMaximumNumberOfPlayersByTime } from "./resultDataHelpers";
import {
  StringNumberObject,
  PriorityObject,
} from "server/typings/common.typings";
import { toPercent } from "server/features/statistics/statsUtil";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getGamesByStartTime = (
  games: readonly Game[]
): StringNumberObject => {
  const gamesByTime = _.countBy(games, "startTime");

  logger.info(`Number of games for each start time: \n`, gamesByTime);
  return gamesByTime;
};

const getUsersByGames = (_users: readonly User[]): StringNumberObject => {
  // TODO: Update to use signup collection
  // const enteredGames = users.flatMap((user) => user.enteredGames);
  const enteredGames: SelectedGame[] = [];
  const usersByGames = _.countBy(enteredGames, "gameDetails.gameId");
  return usersByGames;
};

export const getNumberOfFullGames = (
  games: readonly Game[],
  users: readonly User[]
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
    } (${toPercent(counter / games.length)}%)`
  );
};

const getSignupsByStartTime = (users: readonly User[]): StringNumberObject => {
  const userSignupCountsByTime: StringNumberObject = {};

  logger.warn("Warning: Inaccurate because forming groups deletes signedGames");

  users.forEach((user) => {
    let groupSize = 1;

    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial
      ).length;
    }

    const signedGames = user.signedGames.reduce<StringNumberObject>(
      (acc, signedGame) => {
        acc[signedGame.time] = acc[signedGame.time] + 1 || 1;
        return acc;
      },
      {}
    );

    for (const signupTime in signedGames) {
      userSignupCountsByTime[signupTime] =
        userSignupCountsByTime[signupTime] + groupSize || groupSize;
    }
  });

  // logger.info(`Total number of signups by time: \n`, userSignupCountsByTime)
  return userSignupCountsByTime;
};

export const getDemandByTime = (
  games: readonly Game[],
  users: readonly User[]
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
        signupsByTime[startTime] / maximumNumberOfPlayersByTime[startTime]
      )}%)`
    );
  }
};

export const getDemandByGame = (
  games: readonly Game[],
  users: readonly User[]
): void => {
  logger.info(">>> Demand by games");

  const signedGames = users.reduce<PriorityObject>((acc, user) => {
    let groupSize = 1;
    if (user.groupCode !== "0" && user.groupCode === user.serial) {
      groupSize = users.filter(
        (groupUser) => groupUser.groupCode === user.serial
      ).length;
    }

    user.signedGames.forEach((signedGame) => {
      const foundGame = games.find(
        (game) => game.gameId === signedGame.gameDetails.gameId
      );

      if (!foundGame) return;

      acc[foundGame.title] = {
        first: acc[foundGame.title]?.first ? acc[foundGame.title].first : 0,
        second: acc[foundGame.title]?.second ? acc[foundGame.title].second : 0,
        third: acc[foundGame.title]?.third ? acc[foundGame.title].third : 0,
      };

      if (signedGame.priority === 1) {
        acc[foundGame.title].first = acc[foundGame.title].first + groupSize;
      } else if (signedGame.priority === 2) {
        acc[foundGame.title].second = ++acc[foundGame.title].second + groupSize;
      } else if (signedGame.priority === 3) {
        acc[foundGame.title].third = ++acc[foundGame.title].third + groupSize;
      }
    });
    return acc;
  }, {});

  logger.info(JSON.stringify(signedGames, null, 2));
};
