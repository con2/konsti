import _ from "lodash";
import dayjs from "dayjs";
import {
  PostSignedGamesError,
  PostSignedGamesResponse,
} from "shared/typings/api/myGames";
import { SelectedGame } from "shared/typings/models/user";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import { isValidSignupTime } from "server/features/user/userUtils";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeSignedGames = async (
  selectedGames: readonly SelectedGame[],
  username: string,
  startTime: string,
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
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

  // Check for duplicate priorities, ie. some kind of error
  const gamesByTimeslot = _.groupBy(selectedGames, (game) => game.time);

  for (const [, games] of Object.entries(gamesByTimeslot)) {
    const priorities = games.map((selectedGame) => selectedGame.priority);
    const uniqPriorities = _.uniq(priorities);

    if (priorities.length !== uniqPriorities.length) {
      return {
        message: "Duplicate priority score found",
        status: "error",
        errorId: "samePriority",
      };
    }
  }

  const responseResult = await saveSignedGames({
    signedGames: selectedGames,
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
    signedGames: response.signedGames,
  };
};
