import faker from 'faker';
import moment from 'moment';
import _ from 'lodash';
import { logger } from 'server/utils/logger';
import { updateGamePopularity } from 'server/features/game-popularity/updateGamePopularity';
import { User, SignedGame } from 'server/typings//user.typings';
import { Game } from 'shared/typings/models/game';
import { findUsers, saveSignup } from 'server/features/user/userRepository';
import { findGames } from 'server/features/game/gameRepository';

export const createSignups = async (): Promise<void> => {
  let games: Game[] = [];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`findGames error: ${error}`);
  }

  let allUsers: User[] = [];
  try {
    allUsers = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
  }

  const users = allUsers.filter(
    (user) => user.username !== 'admin' && user.username !== 'ropetiski'
  );

  logger.info(`Signup: ${games.length} games`);
  logger.info(`Signup: ${users.length} users`);

  const groupedUsers = _.groupBy(users, 'groupCode');

  for (const [groupCode, groupMembers] of Object.entries(groupedUsers)) {
    // Individual users
    if (groupCode === '0') {
      logger.info('SIGNUP INDIVIDUAL USERS');
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

const getRandomSignup = (games: readonly Game[]): SignedGame[] => {
  const signedGames = [] as SignedGame[];
  let randomIndex;

  const startTimes = games.map((game) => moment(game.startTime).utc().format());
  const uniqueTimes = Array.from(new Set(startTimes));

  // Select random games for each starting time
  uniqueTimes.forEach((startingTime) => {
    logger.debug(`Generate signups for time ${startingTime}`);
    const gamesForTime = games.filter(
      (games) =>
        moment(games.startTime).format() === moment(startingTime).format()
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
        });
      }
    }
  });

  return signedGames;
};

const signup = async (games: readonly Game[], user: User): Promise<User> => {
  const signedGames = getRandomSignup(games);

  return await saveSignup({
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
    if (user.username !== 'admin' && user.username !== 'ropetiski') {
      promises.push(signup(games, user));
    }
  }

  await Promise.all(promises);
};

const signupGroup = async (
  games: readonly Game[],
  users: readonly User[]
): Promise<void> => {
  // Generate random signup data for the group leader
  const leader = users.find((user) => user.serial === user.groupCode);
  if (!leader) throw new Error('Error getting group leader');

  const signupData = {
    username: leader.username,
    signedGames: getRandomSignup(games),
  };

  await saveSignup(signupData);
};
