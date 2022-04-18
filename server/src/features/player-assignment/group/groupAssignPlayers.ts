import { logger } from "server/utils/logger";
import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { getSignupWishes } from "server/features/player-assignment/utils/getSignupWishes";
import { getSignedGames } from "server/features/player-assignment/utils/getSignedGames";
import { getSelectedPlayers } from "server/features/player-assignment/utils/getSelectedPlayers";
import { assignGroups } from "server/features/player-assignment/group/utils/assignGroup";
import { getPlayerGroups } from "server/features/player-assignment/utils/getPlayerGroups";
import { getGroupMembers } from "server/features/player-assignment/utils/getGroupMembers";
import { getHappiness } from "server/features/player-assignment/group/utils/getHappiness";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { PlayerAssignmentResult } from "server/typings/result.typings";

export const groupAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string
): PlayerAssignmentResult => {
  logger.debug(`***** Run Group Assignment for ${startingTime}`);
  const startingGames = getStartingGames(games, startingTime);

  if (startingGames.length === 0) {
    logger.debug("No starting games, stop!");
    return {
      results: [],
      message: "Group Assign Result - No starting games",
      algorithm: "group",
      status: "error: no starting games",
    };
  }

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    logger.debug("No signup wishes, stop!");
    return {
      results: [],
      message: "Group Assign Result - No signup wishes",
      algorithm: "group",
      status: "error: no signup wishes",
    };
  }

  const signedGames = getSignedGames(startingGames, signupWishes);

  // Selected players are group creators since group members don't have signups at this point
  const groupCreators = getSelectedPlayers(players, startingGames);
  const groupMembers = getGroupMembers(groupCreators, players);
  const allPlayers = groupCreators.concat(groupMembers);
  // Single user is size 1 group
  const playerGroups = getPlayerGroups(allPlayers);

  let numberOfIndividuals = 0;
  let numberOfGroups = 0;
  for (const playerGroup of playerGroups) {
    if (playerGroup.length > 1) {
      numberOfGroups += 1;
    } else {
      numberOfIndividuals += 1;
    }
  }

  logger.debug(`Games with signups: ${signedGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`
  );

  const result = assignGroups(allPlayers, signedGames, playerGroups);

  getHappiness(result.results, playerGroups, allPlayers, startingTime);

  logger.debug(`${result.message}`);

  return Object.assign({
    ...result,
    algorithm: "group",
    status: "success",
  });
};
