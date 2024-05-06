import { first } from "lodash-es";
import dayjs from "dayjs";
import { ListItem } from "server/types/padgRandomAssignTypes";
import { getAssignmentBonus } from "server/features/player-assignment/utils/getAssignmentBonus";
import { Signup, User } from "shared/types/models/user";
import { SignupsForProgramItem } from "server/features/signup/signupTypes";
import { logger } from "server/utils/logger";
import {
  Result,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";

export const getList = (
  playerGroups: readonly User[][],
  startTime: string,
  signups: readonly SignupsForProgramItem[],
): Result<ListItem[], AssignmentError> => {
  const results = playerGroups.flatMap((playerGroup) => {
    const firstMember = first(playerGroup);
    if (!firstMember) {
      logger.error(
        "%s",
        new Error("Padg or Random assign: error getting first member"),
      );
      return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
    }

    const list = firstMember.lotterySignups
      .filter(
        (lotterySignup) =>
          dayjs(lotterySignup.time).toISOString() ===
          dayjs(startTime).toISOString(),
      )
      .map((lotterySignup) => {
        return {
          id:
            firstMember.groupCode !== "0"
              ? firstMember.groupCode
              : firstMember.serial,
          size: playerGroup.length,
          event: lotterySignup.gameDetails.gameId,
          gain: getGain(lotterySignup, playerGroup, signups),
        };
      });

    return makeSuccessResult(list);
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

const getGain = (
  lotterySignup: Signup,
  playerGroup: User[],
  signups: readonly SignupsForProgramItem[],
): number => {
  const bonus = getAssignmentBonus(playerGroup, signups);

  switch (lotterySignup.priority) {
    case 1:
      return 1 + bonus;
    case 2:
      return 0.5 + bonus;
    case 3:
      return 0.33 + bonus;
    default:
      // Invalid priority
      return 0;
  }
};
