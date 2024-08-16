import dayjs from "dayjs";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { isValidSignupTime } from "server/features/user/userUtils";
import {
  DeleteDirectSignupError,
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
} from "shared/types/api/myProgramItems";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import {
  delDirectSignup,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { findUser } from "server/features/user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { config } from "shared/config";

export const storeDirectSignup = async (
  signupRequest: PostDirectSignupRequest,
): Promise<PostDirectSignupResponse | PostDirectSignupError> => {
  const { startTime, directSignupProgramItemId, username } = signupRequest;
  if (config.event().noKonstiSignupIds.includes(directSignupProgramItemId)) {
    return {
      message: `No Konsti signup for this program item`,
      status: "error",
      errorId: "noKonstiSignup",
    };
  }

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    return {
      message: `Signed program item not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const programItem = unwrapResult(programItemResult);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!programItem) {
    return {
      message: `Signed program item not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const directSignupStartTime = getDirectSignupStartTime(programItem);

  if (timeNow.isBefore(directSignupStartTime)) {
    logger.error(
      "%s",
      new Error(
        `Signup for program item ${directSignupProgramItemId} not open yet, opens ${directSignupStartTime.toISOString()}`,
      ),
    );
    return {
      errorId: "signupNotOpenYet",
      message: "Waiting for phase gap to end",
      status: "error",
    };
  }

  const validSignupTime = isValidSignupTime({
    startTime: dayjs(startTime),
    timeNow,
  });

  if (!validSignupTime) {
    return {
      errorId: "signupEnded",
      message: "Signup time ended",
      status: "error",
    };
  }

  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: `Error finding user`,
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userResult);

  if (!user) {
    return {
      message: `Error finding user`,
      status: "error",
      errorId: "unknown",
    };
  }

  const signupResult = await saveDirectSignup(signupRequest);
  if (isErrorResult(signupResult)) {
    return {
      message: `Store signup failure`,
      status: "error",
      errorId: "unknown",
    };
  }

  const signup = unwrapResult(signupResult);

  const newSignup = signup.userSignups.find(
    (userSignup) => userSignup.username === username,
  );

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (signup && newSignup) {
    return {
      message: "Store signup success",
      status: "success",
      directSignup: {
        programItem: signup.programItem,
        priority: newSignup.priority,
        time: newSignup.time,
        message: newSignup.message,
      },
    };
  }

  return {
    message: "Store signup failure for unknown reason",
    status: "error",
    errorId: "unknown",
  };
};

export const removeDirectSignup = async (
  signupRequest: DeleteDirectSignupRequest,
): Promise<DeleteDirectSignupResponse | DeleteDirectSignupError> => {
  const { startTime } = signupRequest;

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

  const validSignupTime = isValidSignupTime({
    startTime: dayjs(startTime),
    timeNow,
  });

  if (!validSignupTime) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const signupResult = await delDirectSignup(signupRequest);
  if (isErrorResult(signupResult)) {
    return {
      message: "Delete signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const signup = unwrapResult(signupResult);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (signup) {
    return {
      message: "Delete signup success",
      status: "success",
    };
  }

  return {
    message: "Delete signup failure for unknown reason",
    status: "error",
    errorId: "unknown",
  };
};
