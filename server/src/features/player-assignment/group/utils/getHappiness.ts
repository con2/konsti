import _ from "lodash";
import { logger } from "server/utils/logger";
import { calculateHappiness } from "server/features/player-assignment/padg/utils/calculateHappiness";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { Result } from "shared/typings/models/result";
import { User } from "shared/typings/models/user";

export const getHappiness = (
  results: readonly Result[],
  playerGroups: readonly User[][],
  allPlayers: readonly User[],
  startingTime: string
): void => {
  const padgAssignment = results.map((result) => {
    const foundPlayer = allPlayers.find(
      (player) => player.username === result.username
    );

    if (!foundPlayer) throw new Error("Error calculating assignment happiness");

    return {
      id:
        foundPlayer.groupCode !== "0"
          ? foundPlayer.groupCode
          : foundPlayer.serial,
      assignment: result.enteredGame.gameDetails.gameId,
    };
  });

  const groups = getGroups(playerGroups, startingTime);
  const happiness = calculateHappiness(_.uniqBy(padgAssignment, "id"), groups);
  logger.debug(`Group assignment completed with happiness ${happiness}%`);
};
