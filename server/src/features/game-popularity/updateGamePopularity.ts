import { logger } from "server/utils/logger";
import { updateWithAssign } from "server/features/game-popularity/utils/updateWithAssign";
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
import { config } from "shared/config";

export const updateGamePopularity = async (): Promise<
  Result<void, MongoDbError | AssignmentError>
> => {
  const { twoPhaseSignupProgramTypes } = config.shared();

  logger.info(`Calculate game popularity`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult).filter((game) =>
    twoPhaseSignupProgramTypes.includes(game.programType),
  );

  const signupsResult = await findSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }
  const signups = unwrapResult(signupsResult);

  const updateWithAssignResult = await updateWithAssign(users, games, signups);
  if (isErrorResult(updateWithAssignResult)) {
    return updateWithAssignResult;
  }

  logger.info("Game popularity updated");

  return makeSuccessResult(undefined);
};
