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
  attendeeGroups: readonly User[][],
  startTime: string,
): Result<Group[], AssignmentError> => {
  const results = attendeeGroups.map((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
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
      size: attendeeGroup.length,
      pref: sortedLotterySignups.map(
        (lotterySignup) => lotterySignup.programItem.programItemId,
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
