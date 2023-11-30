import { first } from "lodash-es";
import { PadgRandomAssignResults } from "server/types/padgRandomAssignTypes";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentResult } from "shared/types/models/result";
import { SelectedGame, User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const formatResults = (
  assignResults: PadgRandomAssignResults,
  playerGroups: readonly User[][],
): Result<readonly AssignmentResult[], AssignmentError> => {
  const selectedPlayers = playerGroups
    .filter((playerGroup) => {
      const firstMember = first(playerGroup);

      if (!firstMember) {
        logger.error(
          "%s",
          new Error("Padg assign: error getting first member"),
        );
        return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
      }

      return assignResults.find(
        (assignResult) =>
          (assignResult.id === firstMember.groupCode ||
            assignResult.id === firstMember.serial) &&
          assignResult.assignment !== -1,
      );
    })
    .flat();

  const getEnteredGame = (player: User): SelectedGame | undefined => {
    return player.signedGames.find((signedGame) => {
      return assignResults.find(
        (assignResult) =>
          (assignResult.id === player.groupCode ||
            assignResult.id === player.serial) &&
          assignResult.assignment === signedGame.gameDetails.gameId,
      );
    });
  };

  const results = selectedPlayers.reduce<AssignmentResult[]>((acc, player) => {
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
