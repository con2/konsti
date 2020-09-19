import _ from 'lodash';
import { toPercent } from '../statsUtil';
import { logger } from 'utils/logger';
import { User } from 'typings/user.typings';
import { StringNumberObject } from 'typings/common.typings';

export const getUsersWithoutGames = (
  users: readonly User[]
): readonly User[] => {
  let counter = 0;
  const usersWithoutGames = [] as User[];
  users.forEach((user) => {
    if (user.enteredGames.length === 0 && user.signedGames.length !== 0) {
      usersWithoutGames.push(user);
      counter += 1;
    }
  });

  logger.info(
    `Players without any entered games: ${counter}/${users.length} (${toPercent(
      counter / users.length
    )}%)`
  );

  return usersWithoutGames;
};

export const getUsersWithoutSignups = (
  users: readonly User[]
): readonly User[] => {
  let counter = 0;
  const usersWithoutSignups = [] as User[];
  users.forEach((user) => {
    if (user.signedGames.length === 0) {
      usersWithoutSignups.push(user);
      counter += 1;
    }
  });

  logger.info(
    `Players without any signed games: ${counter}/${users.length} (${toPercent(
      counter / users.length
    )}%)`
  );

  return usersWithoutSignups;
};

export const getUsersSignupCount = (users: readonly User[]): void => {
  const userSignupCounts: StringNumberObject[] = [];
  users.forEach((user) => {
    const signedGames = _.countBy(user.signedGames, 'time');
    userSignupCounts.push(signedGames);
  });

  const gameWishes: StringNumberObject = {};
  userSignupCounts.forEach((userSignups: StringNumberObject) => {
    for (const signupTime in userSignups) {
      gameWishes[userSignups[signupTime]] =
        ++gameWishes[userSignups[signupTime]] || 1;
    }
  });

  logger.info(
    `Users signed for this many games when they didn't get signed:`,
    gameWishes
  );

  const signupCount: StringNumberObject = {};
  userSignupCounts.forEach((userSignups: StringNumberObject) => {
    signupCount[Object.keys(userSignups).length] =
      ++signupCount[Object.keys(userSignups).length] || 1;
  });

  logger.info(
    `Users didn't get into any games after this many signup attempts:`,
    signupCount
  );
};

export const getUsersWithAllGames = (users: readonly User[]): void => {
  let counter = 0;

  users.forEach((user) => {
    const signedGamesByTime = _.countBy(user.signedGames, 'time');

    if (Object.keys(signedGamesByTime).length === user.enteredGames.length) {
      counter++;
    }
  });

  logger.info(
    `This many users got into a game each time they signed up: ${counter}/${
      users.length
    } (${toPercent(counter / users.length)}%)`
  );
};
