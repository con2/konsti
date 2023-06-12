import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import { AssignmentResult } from "shared/typings/models/result";
import { SelectedGame, User } from "shared/typings/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const buildSignupResults = (
  results: readonly number[][],
  signedGames: readonly Game[],
  players: readonly User[]
): Result<readonly AssignmentResult[], AssignmentError> => {
  const signupResults: AssignmentResult[] = [];

  // Build signup results
  for (let i = 0; i < results.length; i += 1) {
    // Row determines the game
    const selectedRow = results[i][0];

    // Player id
    const selectedPlayer = results[i][1];

    let attendanceRange = 0;

    // Figure what games the row numbers are
    for (let j = 0; j < signedGames.length; j += 1) {
      attendanceRange += signedGames[j].maxAttendance;

      // Found game
      if (selectedRow < attendanceRange) {
        const enteredGame = findEnteredGame(
          signedGames[j],
          players[selectedPlayer].signedGames
        );

        if (!enteredGame) {
          logger.error(
            "%s",
            new Error("Unable to find entered game from signed games")
          );
          return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
        }

        signupResults.push({
          username: players[selectedPlayer].username,
          enteredGame,
        });
        break;
      }
    }
  }
  return makeSuccessResult(signupResults);
};

const findEnteredGame = (
  enteredGame: Game,
  signedGames: readonly SelectedGame[]
): SelectedGame | undefined => {
  return signedGames.find(
    (signedGame) => signedGame.gameDetails.gameId === enteredGame.gameId
  );
};
