import _ from "lodash";
import { PadgRandomAssignResults } from "server/typings/padgRandomAssign.typings";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/typings/api/errors";
import { Result } from "shared/typings/models/result";
import { SelectedGame, User } from "shared/typings/models/user";
import {
  AsyncResult,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/asyncResult";

export const formatResults = (
  assignResults: PadgRandomAssignResults,
  playerGroups: readonly User[][]
): AsyncResult<readonly Result[], AssignmentError> => {
  const selectedPlayers = playerGroups
    .filter((playerGroup) => {
      const firstMember = _.first(playerGroup);

      if (!firstMember) {
        logger.error("Padg assign: error getting first member");
        return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
      }

      return assignResults.find(
        (assignResult) =>
          (assignResult.id === firstMember.groupCode ||
            assignResult.id === firstMember.serial) &&
          assignResult.assignment !== -1
      );
    })
    .flat();

  const getEnteredGame = (player: User): SelectedGame | undefined => {
    return player.signedGames.find((signedGame) => {
      return assignResults.find(
        (assignResult) =>
          (assignResult.id === player.groupCode ||
            assignResult.id === player.serial) &&
          assignResult.assignment === signedGame.gameDetails.gameId
      );
    });
  };

  const results = selectedPlayers.reduce<Result[]>((acc, player) => {
    const enteredGame = getEnteredGame(player);
    if (enteredGame) {
      acc.push({
        username: player.username,
        enteredGame,
      });
    }
    return acc;
  }, []);

  return makeSuccessResult(results);
};
