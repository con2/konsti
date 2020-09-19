import faker from 'faker';
import moment from 'moment';
import _ from 'lodash';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { updateGamePopularity } from 'game-popularity/updateGamePopularity';
import { User, SignedGame } from 'typings//user.typings';
import { Game } from 'typings/game.typings';

export const createSignups = async (): Promise<void> => {
  let games: Game[] = [];
  try {
    games = await db.game.findGames();
  } catch (error) {
    logger.error(`db.game.findGames error: ${error}`);
  }

  let allUsers: User[] = [];
  try {
    allUsers = await db.user.findUsers();
  } catch (error) {
    logger.error(`db.game.findUsers error: ${error}`);
  }

  const users = allUsers.filter(
    (user) => user.username !== 'admin' && user.username !== 'ropetiski'
  );

  logger.info(`Signup: ${games.length} games`);
  logger.info(`Signup: ${users.length} users`);

  const groupedUsers = _.groupBy(users, 'groupCode');

  for (const [key, value] of Object.entries(groupedUsers)) {
    const array = [...value];
    if (key === '0') {
      logger.info('SIGNUP INDIVIDUAL USERS');
      await signupMultiple(games, array);
    } else {
      logger.info(`SIGNUP GROUP ${key}`);
      await signupGroup(games, array);
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
      randomIndex = faker.random.number({
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

  return await db.user.saveSignup({
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
  // Generate random signup data for the first user
  const firstUser = _.first(users);
  if (!firstUser) throw new Error('Error getting first user of group');
  const signedGames = getRandomSignup(games);

  // Assign same signup data for group members
  const promises: Array<Promise<User>> = [];
  for (let i = 0; i < users.length; i++) {
    const signupData = {
      username: users[i].username,
      signedGames: i === 0 ? signedGames : [],
    };

    promises.push(db.user.saveSignup(signupData));
  }

  await Promise.all(promises);
};
