import dayjs from "dayjs";
import {
  PostLotterySignupError,
  PostLotterySignupResponse,
  DeleteLotterySignupResponse,
  DeleteLotterySignupError,
} from "shared/types/api/myProgramItems";
import {
  delLotterySignups,
  saveLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import {
  getLotterySignupEndTime,
  getLotterySignupStartTime,
} from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import { findUser } from "server/features/user/userRepository";
import { State } from "shared/types/models/programItem";

const validPriorities = new Set([1, 2, 3]);

interface StoreLotterySignupParams {
  programItemId: string;
  priority: number;
  username: string;
}

export const storeLotterySignup = async ({
  programItemId,
  priority,
  username,
}: StoreLotterySignupParams): Promise<
  PostLotterySignupResponse | PostLotterySignupError
> => {
  if (!validPriorities.has(priority)) {
    return {
      errorId: "invalidPriority",
      message: `Invalid priority: ${priority}`,
      status: "error",
    };
  }

  const programItemResult = await findProgramItemById(programItemId);
  if (isErrorResult(programItemResult)) {
    return {
      message: `Program item not found: ${programItemId}`,
      status: "error",
      errorId: "programItemNotFound",
    };
  }
  const programItem = unwrapResult(programItemResult);

  if (programItem.state === State.CANCELLED) {
    return {
      message: "Program item is cancelled",
      status: "error",
      errorId: "cancelled",
    };
  }

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = unwrapResult(timeNowResult);

  const lotterySignupStartTime = getLotterySignupStartTime(
    programItem.startTime,
  );
  if (timeNow.isBefore(lotterySignupStartTime)) {
    const message = `Signup for program item ${programItemId} not open yet, opens ${lotterySignupStartTime.toISOString()}`;
    logger.warn(message);
    return {
      errorId: "signupNotOpenYet",
      message,
      status: "error",
    };
  }

  const lotterySignupEndTime = getLotterySignupEndTime(programItem.startTime);
  const signupEnded = hasSignupEnded({
    signupEndTime: lotterySignupEndTime,
    timeNow,
  });
  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: `Signup for program item ${programItemId} has ended at ${lotterySignupEndTime.toISOString()}`,
      status: "error",
    };
  }

  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }
  const user = unwrapResult(userResult);
  if (!user) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }

  const priorityReserved = user.lotterySignups.some(
    (lotterySignup) =>
      dayjs(lotterySignup.signedToStartTime).isSame(
        dayjs(programItem.startTime),
      ) && lotterySignup.priority === priority,
  );

  if (priorityReserved) {
    return {
      message: "Duplicate priority score found",
      status: "error",
      errorId: "samePriority",
    };
  }

  const lotterySignup = {
    programItemId,
    priority,
    signedToStartTime: programItem.startTime,
  };

  const responseResult = await saveLotterySignup({
    lotterySignup,
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
    message: "Lottery signup success",
    status: "success",
    lotterySignups: response.lotterySignups,
  };
};

export const removeLotterySignup = async (
  lotterySignupProgramItemId: string,
  username: string,
): Promise<DeleteLotterySignupResponse | DeleteLotterySignupError> => {
  const programItemResult = await findProgramItemById(
    lotterySignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    return {
      message: `Program item not found: ${lotterySignupProgramItemId}`,
      status: "error",
      errorId: "programItemNotFound",
    };
  }
  const programItem = unwrapResult(programItemResult);

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = unwrapResult(timeNowResult);

  const lotterySignupEndTime = getLotterySignupEndTime(programItem.startTime);

  const signupEnded = hasSignupEnded({
    signupEndTime: lotterySignupEndTime,
    timeNow,
  });
  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: `Signup for program item ${lotterySignupProgramItemId} has ended at ${lotterySignupEndTime.toISOString()}`,
      status: "error",
    };
  }

  const responseResult = await delLotterySignups({
    lotterySignupProgramItemIds: [lotterySignupProgramItemId],
    username,
  });

  if (isErrorResult(responseResult)) {
    return {
      message: "Removing lottery signup failed",
      status: "error",
      errorId: "unknown",
    };
  }

  return { message: "Lottery signup remove success", status: "success" };
};
