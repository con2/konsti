import dayjs from "dayjs";
import { first, sortBy } from "lodash-es";
import { Group } from "server/types/padgRandomAssignTypes";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
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
    const firstMember = first(playerGroup);
    if (!firstMember) {
      logger.error("%s", new Error("Padg assign: error getting first member"));
      return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
    }

    const lotterySignupsForStartTime = firstMember.lotterySignups.filter(
      (lotterySignup) =>
        dayjs(lotterySignup.time).toISOString() ===
        dayjs(startTime).toISOString(),
    );

    const sortedLotterySignups = sortBy(
      lotterySignupsForStartTime,
      (lotterySignup) => lotterySignup.priority,
    );

    return makeSuccessResult({
      id:
        firstMember.groupCode !== "0"
          ? firstMember.groupCode
          : firstMember.serial,
      size: playerGroup.length,
      pref: sortedLotterySignups.map(
        (lotterySignup) => lotterySignup.programItemDetails.gameId,
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
