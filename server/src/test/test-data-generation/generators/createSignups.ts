import { faker } from "@faker-js/faker";
import moment from "moment";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { Game } from "shared/typings/models/game";
import {
  findUsers,
  saveSignedGames,
} from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { SelectedGame, User } from "shared/typings/models/user";

export const createSignups = async (): Promise<void> => {
  const games = await findGames();
  const allUsers = await findUsers();

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "ropetiski"
  );

  logger.info(`Signup: ${games.length} games`);
  logger.info(`Signup: ${users.length} users`);

  const groupedUsers = _.groupBy(users, "groupCode");

  for (const [groupCode, groupMembers] of Object.entries(groupedUsers)) {
    // Individual users
    if (groupCode === "0") {
      logger.info("SIGNUP INDIVIDUAL USERS");
      await signupMultiple(games, groupMembers);
    }
    // Users in groups
    else {
      logger.info(`SIGNUP GROUP ${groupCode}`);
      await signupGroup(games, groupMembers);
    }
  }

  await updateGamePopularity();
};

const getRandomSignup = (games: readonly Game[]): SelectedGame[] => {
  const signedGames = [] as SelectedGame[];
  let randomIndex;

  const startTimes = games.map((game) => moment(game.startTime).utc().format());
  const uniqueTimes = Array.from(new Set(startTimes));

  // Select random games for each starting time
  uniqueTimes.forEach((startingTime) => {
    logger.debug(`Generate signups for time ${startingTime}`);
    const gamesForTime = games.filter(
      (game) =>
        moment(game.startTime).format() === moment(startingTime).format()
    );

    const numberOfSignups = Math.min(gamesForTime.length, 3);

    for (let i = 0; i < numberOfSignups; i += 1) {
      randomIndex = faker.datatype.number({
        min: 0,
        max: gamesForTime.length - 1,
      });

      const randomGame = gamesForTime[randomIndex];

      const duplicate = !!signedGames.find(
        (signedGame) => signedGame.gameDetails.gameId === randomGame.gameId
      );

      if (duplicate) {
        i -= 1;
      } else {
        signedGames.push({
          gameDetails: randomGame,
          priority: i + 1,
          time: randomGame.startTime,
          message: "",
        });
      }
    }
  });

  return signedGames;
};

const signup = async (games: readonly Game[], user: User): Promise<User> => {
  const signedGames = getRandomSignup(games);

  return await saveSignedGames({
    username: user.username,
    signedGames: signedGames,
  });
};

const signupMultiple = async (
  games: readonly Game[],
  users: readonly User[]
): Promise<void> => {
  const promises: Array<Promise<User>> = [];

  for (const user of users) {
    if (user.username !== "admin" && user.username !== "ropetiski") {
      promises.push(signup(games, user));
    }
  }

  await Promise.all(promises);
};

const signupGroup = async (
  games: readonly Game[],
  users: readonly User[]
): Promise<void> => {
  // Generate random signup data for the group creator
  const groupCreator = users.find((user) => user.serial === user.groupCode);
  if (!groupCreator) throw new Error("Error getting group creator");

  const signupData = {
    username: groupCreator.username,
    signedGames: getRandomSignup(games),
  };

  await saveSignedGames(signupData);
};
