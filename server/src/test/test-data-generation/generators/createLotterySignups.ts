import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { groupBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { ProgramItem } from "shared/types/models/programItem";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { Signup, User } from "shared/types/models/user";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";

export const createLotterySignups = async (): Promise<void> => {
  const gamesResult = await findProgramItems();
  const games = unsafelyUnwrapResult(gamesResult);
  const allUsersResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  logger.info(`Signup: ${games.length} games`);
  logger.info(`Signup: ${users.length} users`);

  const groupedUsers = groupBy(users, "groupCode");

  for (const [groupCode, groupMembers] of Object.entries(groupedUsers)) {
    // Individual users
    if (groupCode === "0") {
      logger.info("SIGNUP INDIVIDUAL USERS");
      await lotterySignupMultiple(games, groupMembers);
    }
    // Users in groups
    else {
      logger.info(`SIGNUP GROUP ${groupCode}`);
      await lotterySignupGroup(games, groupMembers);
    }
  }

  await updateGamePopularity();
};

const getRandomLotterySignup = (games: readonly ProgramItem[]): Signup[] => {
  const lotterySignups = [] as Signup[];
  let randomIndex;

  const { twoPhaseSignupProgramTypes, noKonstiSignupIds } = config.shared();

  const activeGames = games
    .filter((game) => twoPhaseSignupProgramTypes.includes(game.programType))
    .filter((game) => !noKonstiSignupIds.includes(game.programItemId));

  const startTimes = activeGames.map((activeGame) =>
    dayjs(activeGame.startTime).toISOString(),
  );
  const uniqueTimes = Array.from(new Set(startTimes));
  const firstFourTimes = uniqueTimes.slice(0, 4);

  // Select random games for each start time
  firstFourTimes.forEach((startTime) => {
    logger.debug(`Generate signups for time ${startTime}`);
    const gamesForTime = activeGames.filter(
      (activeGame) =>
        dayjs(activeGame.startTime).toISOString() ===
        dayjs(startTime).toISOString(),
    );

    const numberOfSignups = Math.min(gamesForTime.length, 3);

    for (let i = 0; i < numberOfSignups; i += 1) {
      randomIndex = faker.number.int({
        min: 0,
        max: gamesForTime.length - 1,
      });

      const randomGame = gamesForTime[randomIndex];

      const duplicate = !!lotterySignups.find(
        (lotterySignup) =>
          lotterySignup.programItemDetails.programItemId ===
          randomGame.programItemId,
      );

      if (duplicate) {
        i -= 1;
      } else {
        lotterySignups.push({
          programItemDetails: randomGame,
          priority: i + 1,
          time: randomGame.startTime,
          message: "",
        });
      }
    }
  });

  return lotterySignups;
};

const doLotterySignup = async (
  games: readonly ProgramItem[],
  user: User,
): Promise<User> => {
  const lotterySignups = getRandomLotterySignup(games);

  const userResult = await saveLotterySignups({
    username: user.username,
    lotterySignups,
  });
  return unsafelyUnwrapResult(userResult);
};

const lotterySignupMultiple = async (
  games: readonly ProgramItem[],
  users: readonly User[],
): Promise<void> => {
  const promises: Array<Promise<User>> = [];

  for (const user of users) {
    if (user.username !== "admin" && user.username !== "helper") {
      promises.push(doLotterySignup(games, user));
    }
  }

  await Promise.all(promises);
};

const lotterySignupGroup = async (
  games: readonly ProgramItem[],
  users: readonly User[],
): Promise<void> => {
  // Generate random signup data for the group creator
  const groupCreator = users.find(
    (user) => user.groupCreatorCode === user.groupCode,
  );
  if (!groupCreator) {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Error getting group creator");
  }

  const signupData = {
    username: groupCreator.username,
    lotterySignups: getRandomLotterySignup(games),
  };

  await saveLotterySignups(signupData);
};
