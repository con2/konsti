import { first } from "lodash-es";
import { PadgRandomAssignResults } from "server/types/padgRandomAssignTypes";
import { logger } from "server/utils/logger";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentResult } from "shared/types/models/result";
import { Signup, User } from "shared/types/models/user";
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

  const getDirectSignup = (player: User): Signup | undefined => {
    return player.lotterySignups.find((lotterySignup) => {
      return assignResults.find(
        (assignResult) =>
          (assignResult.id === player.groupCode ||
            assignResult.id === player.serial) &&
          assignResult.assignment === lotterySignup.programItem.programItemId,
      );
    });
  };

  const results = selectedPlayers.reduce<AssignmentResult[]>((acc, player) => {
    const directSignup = getDirectSignup(player);
    if (directSignup) {
      acc.push({
        username: player.username,
        directSignup,
      });
    }
    return acc;
  }, []);

  return makeSuccessResult(results);
};
