import dayjs from "dayjs";
import { findGameById } from "server/features/game/gameRepository";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { isValidSignupTime } from "server/features/user/userUtils";
import {
  DeleteEnteredGameError,
  DeleteEnteredGameParameters,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameParameters,
  PostEnteredGameResponse,
} from "shared/typings/api/myGames";
import { getDirectSignupStartTime } from "shared/utils/getDirectSignupStartTime";
import { logger } from "server/utils/logger";
import { delSignup, saveSignup } from "server/features/signup/signupRepository";
import { findUser } from "server/features/user/userRepository";

export const storeSignup = async (
  signupRequest: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const { startTime, enteredGameId, username } = signupRequest;
  const timeNow = await getTime();

  let game;
  try {
    game = await findGameById(enteredGameId);
    if (!game) throw new Error("Entered game not found");
  } catch (error) {
    return {
      message: `Signed game not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const directSignupStartTime = getDirectSignupStartTime(game, timeNow);

  if (directSignupStartTime) {
    logger.error(
      `Signup for game ${enteredGameId} not open yet, opens ${directSignupStartTime}`
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

  try {
    const user = await findUser(username);
    if (!user) throw new Error("User not found");
  } catch (error) {
    return {
      message: `Error finding user`,
      status: "error",
      errorId: "unknown",
    };
  }

  let signup;
  try {
    signup = await saveSignup(signupRequest);
  } catch (error) {
    return {
      message: `Store signup failure: ${error}`,
      status: "error",
      errorId: "unknown",
    };
  }

  const newSignup = signup.userSignups.find(
    (userSignup) => userSignup.username === username
  );

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
  signupRequest: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | DeleteEnteredGameError> => {
  const { startTime } = signupRequest;

  const timeNow = await getTime();

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

  let signup;
  try {
    signup = await delSignup(signupRequest);
  } catch (error) {
    return {
      message: "Delete signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

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
