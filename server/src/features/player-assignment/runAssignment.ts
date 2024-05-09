import { logger } from "server/utils/logger";
import { runAssignmentStrategy } from "server/features/player-assignment/utils/runAssignmentStrategy";
import { removeInvalidProgramItemsFromUsers } from "server/features/player-assignment/utils/removeInvalidProgramItemsFromUsers";
import { PlayerAssignmentResult } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { getDynamicStartTime } from "server/features/player-assignment/utils/getDynamicStartTime";
import { sleep } from "server/utils/sleep";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
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

  const removeInvalidGamesResult = await removeInvalidProgramItemsFromUsers();
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
    const matchingLotterySignups = user.lotterySignups.filter(
      (lotterySignup) =>
        twoPhaseSignupProgramTypes.includes(
          lotterySignup.programItemDetails.programType,
        ) &&
        !directSignupAlwaysOpenIds.includes(
          lotterySignup.programItemDetails.gameId,
        ),
    );

    return { ...user, lotterySignups: matchingLotterySignups };
  });

  const gamesResult = await findProgramItems();
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

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const assignResultsResult = runAssignmentStrategy(
    assignmentStrategy,
    filteredUsers,
    filteredGames,
    assignmentTime,
    directSignups,
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
