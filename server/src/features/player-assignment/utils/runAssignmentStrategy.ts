import { logger } from "server/utils/logger";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { randomAssignPlayers } from "server/features/player-assignment/random/randomAssignPlayers";
import { User } from "shared/types/models/user";
import { Game } from "shared/types/models/game";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/types/resultTypes";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";

export const runAssignmentStrategy = (
  assignmentStrategy: AssignmentStrategy,
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`,
  );

  logger.info(
    `Assigning players for games starting at ${startTime.toString()}`,
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === AssignmentStrategy.PADG) {
    return runPadgStrategy(players, games, startTime, directSignups);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM) {
    return runRandomStrategy(players, games, startTime, directSignups);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (assignmentStrategy === AssignmentStrategy.RANDOM_PADG) {
    return runRandomPadgStrategy(players, games, startTime, directSignups);
  }

  return exhaustiveSwitchGuard(assignmentStrategy);
};

const runPadgStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const padgResultResult = padgAssignPlayers(
    players,
    games,
    startTime,
    directSignups,
  );
  if (isErrorResult(padgResultResult)) {
    return padgResultResult;
  }
  const padgResult = unwrapResult(padgResultResult);
  return makeSuccessResult(padgResult);
};

const runRandomStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignPlayers(
    players,
    games,
    startTime,
    directSignups,
  );
  if (isErrorResult(randomResultResult)) {
    return randomResultResult;
  }
  const randomResult = unwrapResult(randomResultResult);
  return makeSuccessResult(randomResult);
};

const runRandomPadgStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignPlayers(
    players,
    games,
    startTime,
    directSignups,
  );
  if (isErrorResult(randomResultResult)) {
    logger.error(
      "%s",
      new Error(`Random assignment failed: ${randomResultResult.error}`),
    );
  }
  const randomResult = isErrorResult(randomResultResult)
    ? {
        results: [],
        message: `Random assignment failed: ${randomResultResult.error}`,
        algorithm: AssignmentStrategy.RANDOM,
        status: AssignmentResultStatus.ERROR,
      }
    : unwrapResult(randomResultResult);

  const padgResultResult = padgAssignPlayers(
    players,
    games,
    startTime,
    directSignups,
  );
  if (isErrorResult(padgResultResult)) {
    logger.error(
      "%s",
      new Error(`PADG assignment failed: ${padgResultResult.error}`),
    );
  }
  const padgResult = isErrorResult(padgResultResult)
    ? {
        results: [],
        message: `PADG assignment failed: ${padgResultResult.error}`,
        algorithm: AssignmentStrategy.PADG,
        status: AssignmentResultStatus.ERROR,
      }
    : unwrapResult(padgResultResult);

  if (isErrorResult(randomResultResult) && isErrorResult(padgResultResult)) {
    logger.error(
      "%s",
      new Error(`Both random and PADG assignments failed, stop assignment`),
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  logger.info(
    `Random result: ${randomResult.results.length} players, Padg result: ${padgResult.results.length} players`,
  );

  if (
    padgResult.status === AssignmentResultStatus.ERROR ||
    randomResult.results.length > padgResult.results.length
  ) {
    logger.info("----> Use Random assign result");
    return makeSuccessResult(randomResult);
  }

  logger.info("----> Use Padg Assign result");
  return makeSuccessResult(padgResult);
};
