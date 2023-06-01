import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { findUsers } from "server/features/user/userRepository";
import { findSignups } from "server/features/signup/signupRepository";
import { ProgramType } from "shared/typings/models/game";
import { sharedConfig } from "shared/config/sharedConfig";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const verifyUserSignups = async (): Promise<
  AsyncResult<void, MongoDbError>
> => {
  logger.info("Verify signed games and signups match for users");

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

  const signupsAsyncResult = await findSignups();
  if (isErrorResult(signupsAsyncResult)) {
    return signupsAsyncResult;
  }

  const signups = unwrapResult(signupsAsyncResult);

  signups.map(({ game, userSignups }) => {
    if (
      game.programType !== ProgramType.TABLETOP_RPG ||
      sharedConfig.directSignupAlwaysOpenIds.includes(game.gameId)
    ) {
      return;
    }

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

  return makeSuccessResult(undefined);
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
