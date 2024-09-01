import { groupBy, uniq } from "lodash-es";
import dayjs from "dayjs";
import {
  PostLotterySignupsError,
  PostLotterSignupsResponse,
} from "shared/types/api/myProgramItems";
import { Signup } from "shared/types/models/user";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeLotterySignups = async (
  lotterySignups: readonly Signup[],
  username: string,
  signupEndTime: string,
): Promise<PostLotterSignupsResponse | PostLotterySignupsError> => {
  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);
  const signupEnded = hasSignupEnded({
    signupEndTime: dayjs(signupEndTime),
    timeNow,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const programItemsByTimeslot = groupBy(
    lotterySignups,
    (programItem) => programItem.time,
  );

  for (const [, programItems] of Object.entries(programItemsByTimeslot)) {
    const priorities = programItems.map(
      (selectedProgramItem) => selectedProgramItem.priority,
    );
    // Delete duplicate priorities, ie. some kind of error
    const uniqPriorities = uniq(priorities);

    if (priorities.length !== uniqPriorities.length) {
      return {
        message: "Duplicate priority score found",
        status: "error",
        errorId: "samePriority",
      };
    }
  }

  const responseResult = await saveLotterySignups({
    lotterySignups,
    username,
  });

  if (isErrorResult(responseResult)) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(responseResult);

  return {
    message: "Signup success",
    status: "success",
    lotterySignups: response.lotterySignups,
  };
};
