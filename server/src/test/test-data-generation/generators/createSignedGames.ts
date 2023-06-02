import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { Game, ProgramType } from "shared/typings/models/game";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { SelectedGame, User } from "shared/typings/models/user";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

export const createSignedGames = async (): Promise<void> => {
  const gamesAsyncResult = await findGames();
  const games = unsafelyUnwrapResult(gamesAsyncResult);
  const allUsersAsyncResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersAsyncResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper"
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

  const activeGames = games.filter(
    (game) => game.programType === ProgramType.TABLETOP_RPG
  );

  const startTimes = activeGames.map((activeGame) =>
    dayjs(activeGame.startTime).format()
  );
  const uniqueTimes = Array.from(new Set(startTimes));

  // Select random games for each starting time
  uniqueTimes.forEach((startingTime) => {
    logger.debug(`Generate signups for time ${startingTime}`);
    const gamesForTime = activeGames.filter(
      (activeGame) =>
        dayjs(activeGame.startTime).format() === dayjs(startingTime).format()
    );

    const numberOfSignups = Math.min(gamesForTime.length, 3);

    for (let i = 0; i < numberOfSignups; i += 1) {
      randomIndex = faker.number.int({
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

  const userAsyncResult = await saveSignedGames({
    username: user.username,
    signedGames,
  });
  return unsafelyUnwrapResult(userAsyncResult);
};

const signupMultiple = async (
  games: readonly Game[],
  users: readonly User[]
): Promise<void> => {
  const promises: Array<Promise<User>> = [];

  for (const user of users) {
    if (user.username !== "admin" && user.username !== "helper") {
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
  if (!groupCreator) {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Error getting group creator");
  }

  const signupData = {
    username: groupCreator.username,
    signedGames: getRandomSignup(games),
  };

  await saveSignedGames(signupData);
};
