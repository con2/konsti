import { logger } from "server/utils/logger";
import { updateWithSignups } from "server/features/game-popularity/utils/updateWithSignups";
import { updateWithAssign } from "server/features/game-popularity/utils/updateWithAssign";
import { config } from "server/config";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSignups } from "server/features/signup/signupRepository";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError, MongoDbError } from "shared/typings/api/errors";

const { gamePopularityUpdateMethod } = config;

export const updateGamePopularity = async (): Promise<
  AsyncResult<void, MongoDbError | AssignmentError>
> => {
  logger.info(
    `Calculate game popularity using "${gamePopularityUpdateMethod}" method`
  );

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  const signupsAsyncResult = await findSignups();
  if (isErrorResult(signupsAsyncResult)) {
    return signupsAsyncResult;
  }

  const signups = unwrapResult(signupsAsyncResult);

  if (gamePopularityUpdateMethod === "signups") {
    const updateWithSignupsAsyncResult = await updateWithSignups(users, games);
    if (isErrorResult(updateWithSignupsAsyncResult)) {
      return updateWithSignupsAsyncResult;
    }
  }

  if (gamePopularityUpdateMethod === "assign") {
    const updateWithAssignAsyncResult = await updateWithAssign(
      users,
      games,
      signups
    );
    if (isErrorResult(updateWithAssignAsyncResult)) {
      return updateWithAssignAsyncResult;
    }
  }

  logger.info("Game popularity updated");

  return makeSuccessResult(undefined);
};
