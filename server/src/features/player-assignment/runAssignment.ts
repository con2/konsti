import { logger } from "server/utils/logger";
import { runAssignmentStrategy } from "server/features/player-assignment/utils/runAssignmentStrategy";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { PlayerAssignmentResult } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { getDynamicStartTime } from "server/features/player-assignment/utils/getDynamicStartTime";
import { sleep } from "server/utils/sleep";
import { findSignups } from "server/features/signup/signupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";

interface RunAssignmentParams {
  assignmentStrategy: AssignmentStrategy;
  startTime?: string;
  useDynamicStartTime?: boolean;
  assignmentDelay?: number;
}

export const runAssignment = async ({
  assignmentStrategy,
  startTime,
  useDynamicStartTime = false,
  assignmentDelay = 0,
}: RunAssignmentParams): Promise<
  Result<PlayerAssignmentResult, MongoDbError | AssignmentError>
> => {
  const assignmentTimeResult = useDynamicStartTime
    ? await getDynamicStartTime()
    : makeSuccessResult(startTime);
  if (isErrorResult(assignmentTimeResult)) {
    return assignmentTimeResult;
  }
  const assignmentTime = unwrapResult(assignmentTimeResult);

  if (!assignmentTime) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

  const removeInvalidGamesResult = await removeInvalidGamesFromUsers();
  if (isErrorResult(removeInvalidGamesResult)) {
    return removeInvalidGamesResult;
  }

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.shared();

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" games
  const filteredUsers = users.map((user) => {
    const matchingSignedGames = user.signedGames.filter(
      (signedGame) =>
        twoPhaseSignupProgramTypes.includes(
          signedGame.gameDetails.programType,
        ) && !directSignupAlwaysOpenIds.includes(signedGame.gameDetails.gameId),
    );

    return { ...user, signedGames: matchingSignedGames };
  });

  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" games
  const filteredGames = games.filter(
    (game) =>
      twoPhaseSignupProgramTypes.includes(game.programType) &&
      !directSignupAlwaysOpenIds.includes(game.gameId),
  );

  const signupsResult = await findSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }
  const signups = unwrapResult(signupsResult);

  const assignResultsResult = runAssignmentStrategy(
    assignmentStrategy,
    filteredUsers,
    filteredGames,
    assignmentTime,
    signups,
  );
  if (isErrorResult(assignResultsResult)) {
    return assignResultsResult;
  }
  const assignResults = unwrapResult(assignResultsResult);

  if (assignResults.results.length === 0) {
    logger.warn(
      `No assign results for start time ${assignmentTime}: ${JSON.stringify(
        assignResults,
      )}`,
    );
    return makeSuccessResult(assignResults);
  }

  const saveResultsResult = await saveResults({
    results: assignResults.results,
    startTime: assignmentTime,
    algorithm: assignResults.algorithm,
    message: assignResults.message,
  });
  if (isErrorResult(saveResultsResult)) {
    return saveResultsResult;
  }

  if (config.server().enableRemoveOverlapSignups) {
    logger.info("Remove overlapping signups");
    const removeOverlapSignupsResult = await removeOverlapSignups(
      assignResults.results,
    );
    if (isErrorResult(removeOverlapSignupsResult)) {
      return removeOverlapSignupsResult;
    }
  }

  return makeSuccessResult(assignResults);
};
