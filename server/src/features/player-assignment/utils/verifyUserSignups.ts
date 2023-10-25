import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { findUsers } from "server/features/user/userRepository";
import { findSignups } from "server/features/signup/signupRepository";
import { ProgramType } from "shared/typings/models/game";
import { config } from "shared/config/config";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

export const verifyUserSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Verify signed games and signups match for users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const signupsResult = await findSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }

  const signups = unwrapResult(signupsResult);

  signups.map(({ game, userSignups }) => {
    if (
      game.programType !== ProgramType.TABLETOP_RPG ||
      config.shared().directSignupAlwaysOpenIds.includes(game.gameId)
    ) {
      return;
    }

    // Verify group member signups match with group creators signedGames
    // If not in group -> user is group creator

    userSignups.map((userSignup) => {
      const matchingUser = users.find(
        (user) => user.username === userSignup.username,
      );

      if (!matchingUser) {
        logger.error(
          "%s",
          new Error(`No matcing user: ${userSignup.username}`),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }

      const groupCreatorResult = getGroupCreator(users, matchingUser);
      if (isErrorResult(groupCreatorResult)) {
        return groupCreatorResult;
      }

      const groupCreator = unwrapResult(groupCreatorResult);

      const matchingCreatorSignedGame = groupCreator.signedGames.find(
        (creatorSignedGame) =>
          creatorSignedGame.gameDetails.gameId === game.gameId &&
          dayjs(creatorSignedGame.time).isSame(userSignup.time),
      );

      if (!matchingCreatorSignedGame) {
        logger.error(
          "%s",
          new Error(
            `No matching signed game found from group creator: ${userSignup.username} - ${game.title}`,
          ),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
    });
  });

  return makeSuccessResult(undefined);
};

const getGroupCreator = (
  users: User[],
  user: User,
): Result<User, MongoDbError> => {
  // User is group member, not group creators -> find group creator
  if (user.groupCode !== "0" && user.groupCode !== user.serial) {
    const groupCreator = users.find(
      (creator) => creator.groupCreatorCode === user.groupCode,
    );

    if (groupCreator) {
      return makeSuccessResult(groupCreator);
    }

    logger.error(
      "%s",
      new Error(`Group creator not found for user ${user.username}`),
    );

    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // User is group creator
  return makeSuccessResult(user);
};
