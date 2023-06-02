import _ from "lodash";
import { logger } from "server/utils/logger";
import { calculateHappiness } from "server/features/player-assignment/padg/utils/calculateHappiness";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { AssignmentResult } from "shared/typings/models/result";
import { User } from "shared/typings/models/user";
import {
  AsyncResult,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError } from "shared/typings/api/errors";

export const getHappiness = (
  results: readonly AssignmentResult[],
  playerGroups: readonly User[][],
  allPlayers: readonly User[],
  startingTime: string
): AsyncResult<void, AssignmentError> => {
  const padgAssignment = results.map((result) => {
    const foundPlayer = allPlayers.find(
      (player) => player.username === result.username
    );

    if (!foundPlayer) {
      logger.error("Error calculating assignment happiness");
      return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
    }

    return makeSuccessResult({
      id:
        foundPlayer.groupCode !== "0"
          ? foundPlayer.groupCode
          : foundPlayer.serial,
      assignment: result.enteredGame.gameDetails.gameId,
    });
  });

  const someAssignmentFailed = padgAssignment.some((assignment) =>
    isErrorResult(assignment)
  );
  if (someAssignmentFailed) {
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const successResults = padgAssignment.flatMap((assignment) => {
    if (isSuccessResult(assignment)) {
      return unwrapResult(assignment);
    }
    return [];
  });

  const groupsAsyncResult = getGroups(playerGroups, startingTime);
  if (isErrorResult(groupsAsyncResult)) {
    return groupsAsyncResult;
  }
  const groups = unwrapResult(groupsAsyncResult);
  const happiness = calculateHappiness(_.uniqBy(successResults, "id"), groups);
  logger.debug(`Group assignment completed with happiness ${happiness}%`);

  return makeSuccessResult(undefined);
};
