import { logger } from "server/utils/logger";
import { groupAssignPlayers } from "server/features/player-assignment/group/groupAssignPlayers";
import { munkresAssignPlayers } from "server/features/player-assignment/munkres/munkresAssignPlayers";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { randomAssignPlayers } from "server/features/player-assignment/random/randomAssignPlayers";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/typings/result.typings";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { Signup } from "server/features/signup/signup.typings";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/typings/api/errors";

export const runAssignmentStrategy = (
  assignmentStrategy: AssignmentStrategy,
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`,
  );

  logger.info(
    `Assigning players for games starting at ${startTime.toString()}`,
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === AssignmentStrategy.MUNKRES) {
    return runMunkresStrategy(players, games, startTime);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP) {
    return runGroupStrategy(players, games, startTime);
  }

  if (assignmentStrategy === AssignmentStrategy.PADG) {
    return runPadgStrategy(players, games, startTime, signups);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM) {
    return runRandomStrategy(players, games, startTime, signups);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP_PADG) {
    return runGroupPadgStrategy(players, games, startTime, signups);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM_PADG) {
    return runRandomPadgStrategy(players, games, startTime, signups);
  }

  return exhaustiveSwitchGuard(assignmentStrategy);
};

const runMunkresStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
): Result<PlayerAssignmentResult, AssignmentError> => {
  const munkresResultResult = munkresAssignPlayers(players, games, startTime);
  if (isErrorResult(munkresResultResult)) {
    return munkresResultResult;
  }
  const munkresResult = unwrapResult(munkresResultResult);
  return makeSuccessResult(munkresResult);
};

const runGroupStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
): Result<PlayerAssignmentResult, AssignmentError> => {
  const groupResultResult = groupAssignPlayers(players, games, startTime);
  if (isErrorResult(groupResultResult)) {
    return groupResultResult;
  }
  const groupResult = unwrapResult(groupResultResult);
  return makeSuccessResult(groupResult);
};

const runPadgStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const padgResultResult = padgAssignPlayers(
    players,
    games,
    startTime,
    signups,
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
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignPlayers(
    players,
    games,
    startTime,
    signups,
  );
  if (isErrorResult(randomResultResult)) {
    return randomResultResult;
  }
  const randomResult = unwrapResult(randomResultResult);
  return makeSuccessResult(randomResult);
};

const runGroupPadgStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const groupResultResult = groupAssignPlayers(players, games, startTime);
  if (isErrorResult(groupResultResult)) {
    logger.error(
      "%s",
      new Error(`Group assignment failed: ${groupResultResult.error}`),
    );
  }
  const groupResult = isErrorResult(groupResultResult)
    ? {
        results: [],
        message: `Random assignment failed: ${groupResultResult.error}`,
        algorithm: AssignmentStrategy.GROUP,
        status: AssignmentResultStatus.ERROR,
      }
    : unwrapResult(groupResultResult);

  const padgResultResult = padgAssignPlayers(
    players,
    games,
    startTime,
    signups,
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

  if (isErrorResult(groupResultResult) && isErrorResult(padgResultResult)) {
    logger.error(
      "%s",
      new Error(`Both group and PADG assignments failed, stop assignment`),
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  logger.info(
    `Group result: ${groupResult.results.length} players, Padg result: ${padgResult.results.length} players`,
  );

  if (
    padgResult.status === AssignmentResultStatus.ERROR ||
    groupResult.results.length > padgResult.results.length
  ) {
    logger.info("----> Use Group Assign result");
    return makeSuccessResult(groupResult);
  }

  logger.info("----> Use Padg Assign result");
  return makeSuccessResult(padgResult);
};

const runRandomPadgStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignPlayers(
    players,
    games,
    startTime,
    signups,
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
    signups,
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
