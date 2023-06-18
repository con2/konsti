import { logger } from "server/utils/logger";
import { groupAssignPlayers } from "server/features/player-assignment/group/groupAssignPlayers";
import { munkresAssignPlayers } from "server/features/player-assignment/munkres/munkresAssignPlayers";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { randomAssignPlayers } from "server/features/player-assignment/random/randomAssignPlayers";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { PlayerAssignmentResult } from "server/typings/result.typings";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { Signup } from "server/features/signup/signup.typings";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/typings/api/errors";

export const runAssignmentStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string,
  assignmentStrategy: AssignmentStrategy,
  signups: readonly Signup[]
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`
  );

  logger.info(
    `Assigning players for games starting at ${startingTime.toString()}`
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === AssignmentStrategy.MUNKRES) {
    const munkresResultResult = munkresAssignPlayers(
      players,
      games,
      startingTime
    );
    if (isErrorResult(munkresResultResult)) {
      return munkresResultResult;
    }
    const munkresResult = unwrapResult(munkresResultResult);
    return makeSuccessResult(munkresResult);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP) {
    const groupResultResult = groupAssignPlayers(players, games, startingTime);
    if (isErrorResult(groupResultResult)) {
      return groupResultResult;
    }
    const groupResult = unwrapResult(groupResultResult);
    return makeSuccessResult(groupResult);
  }

  if (assignmentStrategy === AssignmentStrategy.PADG) {
    const padgResultResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultResult)) {
      return padgResultResult;
    }
    const padgResult = unwrapResult(padgResultResult);
    return makeSuccessResult(padgResult);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM) {
    const randomResultResult = randomAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(randomResultResult)) {
      return randomResultResult;
    }
    const randomResult = unwrapResult(randomResultResult);
    return makeSuccessResult(randomResult);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP_PADG) {
    const groupResultResult = groupAssignPlayers(players, games, startingTime);
    if (isErrorResult(groupResultResult)) {
      return groupResultResult;
    }
    const groupResult = unwrapResult(groupResultResult);

    const padgResultResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultResult)) {
      return padgResultResult;
    }

    const padgResult = unwrapResult(padgResultResult);

    logger.info(
      `Group result: ${groupResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );

    if (groupResult.results.length > padgResult.results.length) {
      logger.info("----> Use Group Assign result");
      return makeSuccessResult(groupResult);
    }
    logger.info("----> Use Padg Assign result");
    return makeSuccessResult(padgResult);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM_PADG) {
    const randomResultResult = randomAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(randomResultResult)) {
      return randomResultResult;
    }
    const randomResult = unwrapResult(randomResultResult);
    const padgResultResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultResult)) {
      return padgResultResult;
    }
    const padgResult = unwrapResult(padgResultResult);
    logger.info(
      `Random result: ${randomResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );
    if (randomResult.results.length > padgResult.results.length) {
      logger.info("----> Use Random assign result");
      return makeSuccessResult(randomResult);
    }
    logger.info("----> Use Padg Assign result");
    return makeSuccessResult(padgResult);
  }

  return exhaustiveSwitchGuard(assignmentStrategy);
};
