import { logger } from "server/utils/logger";
import { updateWithSignups } from "server/features/game-popularity/utils/updateWithSignups";
import { updateWithAssign } from "server/features/game-popularity/utils/updateWithAssign";
import { config } from "server/config";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSignups } from "server/features/signup/signupRepository";
import { Signup } from "server/features/signup/signup.typings";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

const { gamePopularityUpdateMethod } = config;

export const updateGamePopularity = async (): Promise<
  AsyncResult<void, MongoDbError>
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

  let signups: Signup[] = [];
  try {
    signups = await findSignups();
  } catch (error) {
    logger.error(`findSignups error: ${error}`);
  }

  if (gamePopularityUpdateMethod === "signups")
    await updateWithSignups(users, games);
  else if (gamePopularityUpdateMethod === "assign")
    await updateWithAssign(users, games, signups);

  logger.info("Game popularity updated");

  return makeSuccessResult(undefined);
};
