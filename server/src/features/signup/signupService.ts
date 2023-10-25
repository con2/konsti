import dayjs from "dayjs";
import { findGameById } from "server/features/game/gameRepository";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import { isValidSignupTime } from "server/features/user/userUtils";
import {
  DeleteEnteredGameError,
  DeleteEnteredGameRequest,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameRequest,
  PostEnteredGameResponse,
} from "shared/typings/api/myGames";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import { delSignup, saveSignup } from "server/features/signup/signupRepository";
import { findUser } from "server/features/user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { config } from "shared/config/config";

export const storeSignup = async (
  signupRequest: PostEnteredGameRequest,
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const { startTime, enteredGameId, username } = signupRequest;
  if (config.shared().noKonstiSignupIds.includes(enteredGameId)) {
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

  const gameResult = await findGameById(enteredGameId);
  if (isErrorResult(gameResult)) {
    return {
      message: `Signed game not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const game = unwrapResult(gameResult);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!game) {
    return {
      message: `Signed game not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const directSignupStartTime = getDirectSignupStartTime(game);

  if (timeNow.isBefore(directSignupStartTime)) {
    logger.error(
      "%s",
      new Error(
        `Signup for game ${enteredGameId} not open yet, opens ${directSignupStartTime.toISOString()}`,
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

  const signupResult = await saveSignup(signupRequest);
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
      enteredGame: {
        gameDetails: signup.game,
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

export const removeSignup = async (
  signupRequest: DeleteEnteredGameRequest,
): Promise<DeleteEnteredGameResponse | DeleteEnteredGameError> => {
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

  const signupResult = await delSignup(signupRequest);
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
