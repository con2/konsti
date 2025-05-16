import dayjs from "dayjs";
import {
  PostLotterySignupError,
  PostLotterSignupResponse,
  DeleteLotterySignupRequest,
  DeleteLotterySignupResponse,
  DeleteLotterySignupError,
} from "shared/types/api/myProgramItems";
import { LotterySignup } from "shared/types/models/user";
import {
  delLotterySignup,
  saveLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeLotterySignup = async (
  lotterySignup: LotterySignup,
  username: string,
): Promise<PostLotterSignupResponse | PostLotterySignupError> => {
  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = unwrapResult(timeNowResult);

  const signupEnded = hasSignupEnded({
    signupEndTime: dayjs(lotterySignup.signedToStartTime),
    timeNow,
  });
  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  // TODO: Handle case where same priority submitted for same start time
  /*
  return {
    message: "Duplicate priority score found",
    status: "error",
    errorId: "samePriority",
  };
  */

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
    message: "Signup success",
    status: "success",
    lotterySignups: response.lotterySignups,
  };
};

export const removeLotterySignup = async (
  removeRequest: DeleteLotterySignupRequest,
  username: string,
): Promise<DeleteLotterySignupResponse | DeleteLotterySignupError> => {
  const responseResult = await delLotterySignup({
    lotterySignupProgramItemId: removeRequest.lotterySignupProgramItemId,
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
