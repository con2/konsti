import { logger } from "server/utils/logger";
import { runAssignmentStrategy } from "server/features/player-assignment/utils/runAssignmentStrategy";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { PlayerAssignmentResult } from "server/typings/result.typings";
import { ProgramType } from "shared/typings/models/game";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { config } from "server/config";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { getDynamicStartingTime } from "server/features/player-assignment/utils/getDynamicStartingTime";
import { sleep } from "server/utils/sleep";
import { findSignups } from "server/features/signup/signupRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError, MongoDbError } from "shared/typings/api/errors";

const { directSignupAlwaysOpenIds } = sharedConfig;

interface RunAssignmentParams {
  assignmentStrategy: AssignmentStrategy;
  startingTime?: string;
  useDynamicStartingTime?: boolean;
  assignmentDelay?: number;
}

export const runAssignment = async ({
  assignmentStrategy,
  startingTime,
  useDynamicStartingTime = false,
  assignmentDelay = 0,
}: RunAssignmentParams): Promise<
  AsyncResult<PlayerAssignmentResult, MongoDbError | AssignmentError>
> => {
  const assignmentTimeAsyncResult = useDynamicStartingTime
    ? await getDynamicStartingTime()
    : makeSuccessResult(startingTime);
  if (isErrorResult(assignmentTimeAsyncResult)) {
    return assignmentTimeAsyncResult;
  }

  const assignmentTime = unwrapResult(assignmentTimeAsyncResult);

  if (!assignmentTime) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

  const removeInvalidGamesAsyncResult = await removeInvalidGamesFromUsers();
  if (isErrorResult(removeInvalidGamesAsyncResult)) {
    return removeInvalidGamesAsyncResult;
  }

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

  // Only include TABLETOP_RPG and don't include "directSignupAlwaysOpen" games
  const filteredUsers = users.map((user) => {
    const matchingSignedGames = user.signedGames.filter(
      (signedGame) =>
        !directSignupAlwaysOpenIds.includes(signedGame.gameDetails.gameId) &&
        signedGame.gameDetails.programType === ProgramType.TABLETOP_RPG
    );

    return { ...user, signedGames: matchingSignedGames };
  });

  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  // Only include TABLETOP_RPG and don't include "directSignupAlwaysOpen" games
  const filteredGames = games.filter(
    (game) =>
      !directSignupAlwaysOpenIds.includes(game.gameId) &&
      game.programType === ProgramType.TABLETOP_RPG
  );

  const signupsAsyncResult = await findSignups();
  if (isErrorResult(signupsAsyncResult)) {
    return signupsAsyncResult;
  }

  const signups = unwrapResult(signupsAsyncResult);

  const assignResultsAsyncResult = runAssignmentStrategy(
    filteredUsers,
    filteredGames,
    assignmentTime,
    assignmentStrategy,
    signups
  );
  if (isErrorResult(assignResultsAsyncResult)) {
    return assignResultsAsyncResult;
  }

  const assignResults = unwrapResult(assignResultsAsyncResult);

  if (assignResults.results.length === 0) {
    logger.warn(
      `No assign results for starting time ${assignmentTime}: ${JSON.stringify(
        assignResults
      )}`
    );
    return makeSuccessResult(assignResults);
  }

  const saveResultsAsyncResult = await saveResults({
    results: assignResults.results,
    startingTime: assignmentTime,
    algorithm: assignResults.algorithm,
    message: assignResults.message,
  });
  if (isErrorResult(saveResultsAsyncResult)) {
    return saveResultsAsyncResult;
  }

  if (config.enableRemoveOverlapSignups) {
    logger.info("Remove overlapping signups");
    const removeOverlapSignupsAsyncResult = await removeOverlapSignups(
      assignResults.results
    );
    if (isErrorResult(removeOverlapSignupsAsyncResult)) {
      return removeOverlapSignupsAsyncResult;
    }
  }

  return makeSuccessResult(assignResults);
};
