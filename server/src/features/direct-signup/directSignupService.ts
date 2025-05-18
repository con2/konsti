import dayjs from "dayjs";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import {
  DeleteDirectSignupError,
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
} from "shared/types/api/myProgramItems";
import {
  getDirectSignupEndTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import {
  delDirectSignup,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { findUser } from "server/features/user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { config } from "shared/config";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";

export const storeDirectSignup = async (
  signupRequest: PostDirectSignupRequest,
  username: string,
): Promise<PostDirectSignupResponse | PostDirectSignupError> => {
  const { directSignupProgramItemId } = signupRequest;
  if (config.event().noKonstiSignupIds.includes(directSignupProgramItemId)) {
    return {
      message: "No Konsti signup for this program item",
      status: "error",
      errorId: "noKonstiSignup",
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

  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    const message = `Signed program item ${directSignupProgramItemId} not found`;
    logger.warn(message);
    return {
      message,
      status: "error",
      errorId: "unknown",
    };
  }

  const programItem = unwrapResult(programItemResult);

  const directSignupStartTime = getDirectSignupStartTime(programItem);

  if (timeNow.isBefore(directSignupStartTime)) {
    const message = `Signup for program item ${directSignupProgramItemId} not open yet, opens ${directSignupStartTime.toISOString()}`;
    logger.warn(message);
    return {
      errorId: "signupNotOpenYet",
      message,
      status: "error",
    };
  }

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const signupEnded = hasSignupEnded({
    signupEndTime: dayjs(directSignupEndTime),
    timeNow,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup time ended",
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

  const newDirectSignup: SignupRepositoryAddSignup = {
    ...signupRequest,
    username,
    signedToStartTime: programItem.startTime,
  };

  const signupResult = await saveDirectSignup(newDirectSignup);
  if (isErrorResult(signupResult)) {
    return {
      message: "Store signup failure",
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
        programItemId: signup.programItemId,
        priority: newSignup.priority,
        signedToStartTime: newSignup.signedToStartTime,
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
  username: string,
): Promise<DeleteDirectSignupResponse | DeleteDirectSignupError> => {
  const { directSignupProgramItemId } = signupRequest;

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    const message = `Signed program item ${directSignupProgramItemId} not found`;
    logger.warn(message);
    return {
      message,
      status: "error",
      errorId: "unknown",
    };
  }
  const programItem = unwrapResult(programItemResult);

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const signupEnded = hasSignupEnded({
    signupEndTime: dayjs(directSignupEndTime),
    timeNow,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const signupResult = await delDirectSignup({
    directSignupProgramItemId: signupRequest.directSignupProgramItemId,
    username,
  });
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
