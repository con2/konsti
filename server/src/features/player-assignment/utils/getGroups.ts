import dayjs from "dayjs";
import _ from "lodash";
import { Group } from "server/typings/padgRandomAssign.typings";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/typings/api/errors";
import { User } from "shared/typings/models/user";
import {
  Result,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const getGroups = (
  playerGroups: readonly User[][],
  startTime: string,
): Result<Group[], AssignmentError> => {
  const results = playerGroups.map((playerGroup) => {
    const firstMember = _.first(playerGroup);
    if (!firstMember) {
      logger.error("%s", new Error("Padg assign: error getting first member"));
      return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
    }

    const signedGamesForStartTime = firstMember.signedGames.filter(
      (signedGame) =>
        dayjs(signedGame.time).toISOString() === dayjs(startTime).toISOString(),
    );

    const sortedSignedGames = _.sortBy(
      signedGamesForStartTime,
      (signedGame) => signedGame.priority,
    );

    return makeSuccessResult({
      id:
        firstMember.groupCode !== "0"
          ? firstMember.groupCode
          : firstMember.serial,
      size: playerGroup.length,
      pref: sortedSignedGames.map(
        (signedGame) => signedGame.gameDetails.gameId,
      ),
    });
  });

  const someResultFailed = results.some((result) => isErrorResult(result));
  if (someResultFailed) {
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const successResults = results.flatMap((result) => {
    if (isSuccessResult(result)) {
      return unwrapResult(result);
    }
    return [];
  });

  return makeSuccessResult(successResults);
};
