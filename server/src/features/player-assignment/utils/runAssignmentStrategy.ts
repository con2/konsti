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
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError } from "shared/typings/api/errors";

export const runAssignmentStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string,
  assignmentStrategy: AssignmentStrategy,
  signups: readonly Signup[]
): AsyncResult<PlayerAssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`
  );

  logger.info(
    `Assigning players for games starting at ${startingTime.toString()}`
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === AssignmentStrategy.MUNKRES) {
    const munkresResult = munkresAssignPlayers(players, games, startingTime);
    return makeSuccessResult(munkresResult);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP) {
    const groupResultAsyncResult = groupAssignPlayers(
      players,
      games,
      startingTime
    );
    if (isErrorResult(groupResultAsyncResult)) {
      return groupResultAsyncResult;
    }
    const groupResult = unwrapResult(groupResultAsyncResult);
    return makeSuccessResult(groupResult);
  }

  if (assignmentStrategy === AssignmentStrategy.PADG) {
    const padgResultAsyncResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultAsyncResult)) {
      return padgResultAsyncResult;
    }
    const padgResult = unwrapResult(padgResultAsyncResult);
    return makeSuccessResult(padgResult);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM) {
    const randomResultAsyncResult = randomAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(randomResultAsyncResult)) {
      return randomResultAsyncResult;
    }
    const randomResult = unwrapResult(randomResultAsyncResult);
    return makeSuccessResult(randomResult);
  }

  if (assignmentStrategy === AssignmentStrategy.GROUP_PADG) {
    const groupResultAsyncResult = groupAssignPlayers(
      players,
      games,
      startingTime
    );
    if (isErrorResult(groupResultAsyncResult)) {
      return groupResultAsyncResult;
    }
    const groupResult = unwrapResult(groupResultAsyncResult);

    const padgResultAsyncResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultAsyncResult)) {
      return padgResultAsyncResult;
    }

    const padgResult = unwrapResult(padgResultAsyncResult);

    logger.info(
      `Group result: ${groupResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );

    if (groupResult.results.length > padgResult.results.length) {
      logger.info("----> Use Group Assign result");
      return makeSuccessResult(groupResult);
    } else {
      logger.info("----> Use Padg Assign result");
      return makeSuccessResult(padgResult);
    }
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM_PADG) {
    const randomResultAsyncResult = randomAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(randomResultAsyncResult)) {
      return randomResultAsyncResult;
    }
    const randomResult = unwrapResult(randomResultAsyncResult);
    const padgResultAsyncResult = padgAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    if (isErrorResult(padgResultAsyncResult)) {
      return padgResultAsyncResult;
    }
    const padgResult = unwrapResult(padgResultAsyncResult);
    logger.info(
      `Random result: ${randomResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );
    if (randomResult.results.length > padgResult.results.length) {
      logger.info("----> Use Random assign result");
      return makeSuccessResult(randomResult);
    } else {
      logger.info("----> Use Padg Assign result");
      return makeSuccessResult(padgResult);
    }
  }

  return exhaustiveSwitchGuard(assignmentStrategy);
};
