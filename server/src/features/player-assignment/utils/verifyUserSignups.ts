import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { findUsers } from "server/features/user/userRepository";
import { findSignups } from "server/features/signup/signupRepository";
import { Signup } from "server/features/signup/signup.typings";

export const verifyUserSignups = async (): Promise<void> => {
  logger.info("Verify signed games and signups match for users");

  let users: User[];
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let signups: Signup[];
  try {
    signups = await findSignups();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  signups.map(({ game, userSignups }) => {
    // Verify group member signups match with group creators signedGames
    // If not in group -> user is group creator

    userSignups.map((userSignup) => {
      const matchingUser = users.find(
        (user) => user.username === userSignup.username
      );

      if (!matchingUser) {
        throw new Error(`No matcing user: "${userSignup.username}"`);
      }

      const groupCreator = getGroupCreator(users, matchingUser);

      const matchingCreatorSignedGame = groupCreator.signedGames.find(
        (creatorSignedGame) =>
          creatorSignedGame.gameDetails.gameId === game.gameId &&
          dayjs(creatorSignedGame.time).isSame(userSignup.time)
      );

      if (!matchingCreatorSignedGame) {
        throw new Error(
          `No matching signed game found from group creator: "${userSignup.username}" - "${game.title}"`
        );
      }
    });
  });
};

const getGroupCreator = (users: User[], user: User): User => {
  // User is group member, not group creators -> find group creator
  if (user.groupCode !== "0" && user.groupCode !== user.serial) {
    const groupCreator = users.find(
      (creator) => creator.serial === user.groupCode
    );

    if (groupCreator) {
      return groupCreator;
    } else {
      throw new Error(`Group creator not found for user ${user.username}`);
    }
  }

  // User is group creator
  return user;
};
