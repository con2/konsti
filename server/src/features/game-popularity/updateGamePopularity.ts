import { logger } from "server/utils/logger";
import { updateWithSignups } from "server/features/game-popularity/utils/updateWithSignups";
import { updateWithAssign } from "server/features/game-popularity/utils/updateWithAssign";
import { config } from "server/config";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSignups } from "server/features/signup/signupRepository";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/typings/api/errors";

const { gamePopularityUpdateMethod } = config;

export const updateGamePopularity = async (): Promise<
  Result<void, MongoDbError | AssignmentError>
> => {
  logger.info(
    `Calculate game popularity using ${gamePopularityUpdateMethod} method`
  );

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const gamesResult = await findGames();

  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }

  const games = unwrapResult(gamesResult);

  const signupsResult = await findSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }

  const signups = unwrapResult(signupsResult);

  if (gamePopularityUpdateMethod === "signups") {
    const updateWithSignupsResult = await updateWithSignups(users, games);
    if (isErrorResult(updateWithSignupsResult)) {
      return updateWithSignupsResult;
    }
  }

  if (gamePopularityUpdateMethod === "assign") {
    const updateWithAssignResult = await updateWithAssign(
      users,
      games,
      signups
    );
    if (isErrorResult(updateWithAssignResult)) {
      return updateWithAssignResult;
    }
  }

  logger.info("Game popularity updated");

  return makeSuccessResult(undefined);
};
