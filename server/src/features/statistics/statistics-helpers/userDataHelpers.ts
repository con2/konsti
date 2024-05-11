import { countBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { toPercent } from "server/features/statistics/statsUtil";

export const getUsersWithoutProgramItems = (
  users: readonly User[],
): readonly User[] => {
  const counter = 0;
  const usersWithoutProgramItems = [] as User[];
  // TODO: Update to use signup collection
  /*
  users.forEach((user) => {
    if (user.directSignups.length === 0 && user.lotterySignups.length !== 0) {
      usersWithoutProgramItems.push(user);
      counter += 1;
    }
  });
  */

  logger.info(
    `Attendees without any direct signup: ${counter}/${users.length} (${toPercent(
      counter / users.length,
    )}%)`,
  );

  return usersWithoutProgramItems;
};

export const getUsersWithoutSignups = (
  users: readonly User[],
): readonly User[] => {
  let counter = 0;
  const usersWithoutSignups = [] as User[];
  users.forEach((user) => {
    if (user.lotterySignups.length === 0) {
      usersWithoutSignups.push(user);
      counter += 1;
    }
  });

  logger.info(
    `Attendees without any lottery signups: ${counter}/${users.length} (${toPercent(
      counter / users.length,
    )}%)`,
  );

  return usersWithoutSignups;
};

export const getUsersSignupCount = (users: readonly User[]): void => {
  const userSignupCounts: Array<Record<string, number>> = [];
  users.forEach((user) => {
    const lotterySignups = countBy(user.lotterySignups, "time");
    userSignupCounts.push(lotterySignups);
  });

  const programItemLotterySignups: Record<string, number> = {};
  userSignupCounts.forEach((userSignups: Record<string, number>) => {
    for (const signupTime in userSignups) {
      programItemLotterySignups[userSignups[signupTime]] =
        ++programItemLotterySignups[userSignups[signupTime]] || 1;
    }
  });

  logger.info(
    `Users signed for this many program items when they didn't get signed:`,
    programItemLotterySignups,
  );

  const signupCount: Record<string, number> = {};
  userSignupCounts.forEach((userSignups: Record<string, number>) => {
    signupCount[Object.keys(userSignups).length] =
      ++signupCount[Object.keys(userSignups).length] || 1;
  });

  logger.info(
    `Users didn't get into any program items after this many signup attempts:`,
    signupCount,
  );
};

export const getUsersWithAllProgramItems = (_users: readonly User[]): void => {
  // TODO: Update to use signup collection
  /*
  let counter = 0;

  users.forEach((user) => {
    const lotterySignupsByTime = countBy(user.lotterySignups, "time");

    if (Object.keys(lotterySignupsByTime).length === user.directSignups.length) {
      counter++;
    }
  });

  logger.info(
    `This many users got into a program item each time they signed up: ${counter}/${
      users.length
    } (${toPercent(counter / users.length)}%)`
  );
  */
};
