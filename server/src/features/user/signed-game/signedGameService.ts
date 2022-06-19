import _ from "lodash";
import { isValidSignupTime } from "server/features/user/userUtils";
import {
  PostSignedGamesError,
  PostSignedGamesResponse,
} from "shared/typings/api/myGames";
import { SelectedGame } from "shared/typings/models/user";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { getTime } from "server/features/player-assignment/utils/getTime";

export const storeSignedGames = async (
  selectedGames: readonly SelectedGame[],
  username: string,
  signupTime: string
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
  if (!signupTime) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = await getTime();

  const validSignupTime = isValidSignupTime({ signupTime, timeNow });
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

  try {
    const response = await saveSignedGames({
      signedGames: selectedGames,
      username,
    });
    return {
      message: "Signup success",
      status: "success",
      signedGames: response.signedGames,
    };
  } catch (error) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }
};
