import { first } from "lodash-es";
import dayjs from "dayjs";
import { ListItem } from "server/types/padgRandomAssignTypes";
import { getAssignmentBonus } from "server/features/assignment/utils/getAssignmentBonus";
import { LotterySignup, User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
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
import { ProgramItem } from "shared/types/models/programItem";

interface GetListParams {
  attendeeGroups: readonly User[][];
  startTime: string;
  directSignups: readonly DirectSignupsForProgramItem[];
  lotterySignupProgramItems: readonly ProgramItem[];
}

// TODO: This should not return Result since it's just synchronous logic
export const getList = ({
  attendeeGroups,
  startTime,
  directSignups,
  lotterySignupProgramItems,
}: GetListParams): Result<ListItem[], AssignmentError> => {
  const results = attendeeGroups.flatMap((attendeeGroup) => {
    const firstMember = first(attendeeGroup);
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
            firstMember.groupCode === "0"
              ? firstMember.serial
              : firstMember.groupCode,
          size: attendeeGroup.length,
          event: lotterySignup.programItem.programItemId,
          gain: getGain(
            lotterySignup,
            attendeeGroup,
            directSignups,
            lotterySignupProgramItems,
          ),
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
  lotterySignup: LotterySignup,
  attendeeGroup: User[],
  directSignups: readonly DirectSignupsForProgramItem[],
  lotterySignupProgramItems: readonly ProgramItem[],
): number => {
  const bonus = getAssignmentBonus(
    attendeeGroup,
    directSignups,
    lotterySignupProgramItems,
  );

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
