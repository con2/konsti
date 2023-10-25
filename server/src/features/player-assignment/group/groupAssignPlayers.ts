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
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/typings/result.typings";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/typings/api/errors";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";

export const groupAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Group Assignment for ${startTime}`);
  const startingGames = getStartingGames(games, startTime);

  if (startingGames.length === 0) {
    logger.debug("No starting games, stop!");
    return makeSuccessResult({
      results: [],
      message: "Group Assign Result - No starting games",
      algorithm: AssignmentStrategy.GROUP,
      status: AssignmentResultStatus.NO_STARTING_GAMES,
    });
  }

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    logger.debug("No signup wishes, stop!");
    return makeSuccessResult({
      results: [],
      message: "Group Assign Result - No signup wishes",
      algorithm: AssignmentStrategy.GROUP,
      status: AssignmentResultStatus.NO_SIGNUP_WISHES,
    });
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
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const resultResult = assignGroups(allPlayers, signedGames, playerGroups);
  if (isErrorResult(resultResult)) {
    return resultResult;
  }

  const result = unwrapResult(resultResult);

  const getHappinessResult = getHappiness(
    result.results,
    playerGroups,
    allPlayers,
    startTime,
  );
  if (isErrorResult(getHappinessResult)) {
    return getHappinessResult;
  }

  logger.debug(`${result.message}`);

  return makeSuccessResult(
    Object.assign({
      ...result,
      algorithm: AssignmentStrategy.GROUP,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
