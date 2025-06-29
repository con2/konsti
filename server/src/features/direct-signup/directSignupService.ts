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
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { config } from "shared/config";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { getSignupMessage } from "server/features/program-item/programItemUtils";
import { findSettings } from "server/features/settings/settingsRepository";

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
    signupEndTime: directSignupEndTime,
    timeNow,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup time ended",
      status: "error",
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

  const settingsResult = await findSettings();
  if (isErrorResult(settingsResult)) {
    return {
      message: "Error loading settings",
      status: "error",
      errorId: "unknown",
    };
  }
  const settings = unwrapResult(settingsResult);
  const signupQuestion = settings.signupQuestions.find(
    (message) => message.programItemId === programItem.programItemId,
  );

  const allSignups = {
    programItemId: signup.programItemId,
    userSignups: signup.userSignups.map((userSignup) => ({
      username: userSignup.username,
      message: getSignupMessage(signupQuestion, userSignup.message),
    })),
  };

  // Check if current user is signed in
  // If user is not included, the program item was full
  const newSignup = signup.userSignups.find(
    (userSignup) => userSignup.username === username,
  );

  if (newSignup) {
    return {
      message: "Store signup success",
      status: "success",
      allSignups,
      directSignup: {
        programItemId: signup.programItemId,
        priority: newSignup.priority,
        signedToStartTime: newSignup.signedToStartTime,
        message: getSignupMessage(signupQuestion, newSignup.message),
      },
    };
  }

  return {
    message: "Program item full",
    status: "success",
    allSignups,
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
    signupEndTime: directSignupEndTime,
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

  const settingsResult = await findSettings();
  if (isErrorResult(settingsResult)) {
    return {
      message: "Error loading settings",
      status: "error",
      errorId: "unknown",
    };
  }
  const settings = unwrapResult(settingsResult);
  const signupQuestion = settings.signupQuestions.find(
    (message) => message.programItemId === programItem.programItemId,
  );

  return {
    message: "Delete signup success",
    status: "success",
    allSignups: {
      programItemId: signup.programItemId,
      userSignups: signup.userSignups.map((userSignup) => ({
        username: userSignup.username,
        message: getSignupMessage(signupQuestion, userSignup.message),
      })),
    },
  };
};
