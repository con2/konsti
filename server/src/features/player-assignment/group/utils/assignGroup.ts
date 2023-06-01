import { logger } from "server/utils/logger";
import { runGroupAssignment } from "server/features/player-assignment/group/utils/runGroupAssignment";
import { config } from "server/config";
import { Game } from "shared/typings/models/game";
import { AssignmentStrategyResult } from "server/typings/result.typings";
import { User } from "shared/typings/models/user";
import { Result } from "shared/typings/models/result";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError } from "shared/typings/api/errors";

export const assignGroups = (
  selectedPlayers: readonly User[],
  signedGames: readonly Game[],
  playerGroups: readonly User[][]
): AsyncResult<AssignmentStrategyResult, AssignmentError> => {
  const { GROUP_ASSIGNMENT_ROUNDS } = config;

  let bestScore = 0;
  let players = 0;
  let games = 0;
  let bestResult = [] as readonly Result[];

  for (let i = 0; i < GROUP_ASSIGNMENT_ROUNDS; i++) {
    const resultAsyncResult = runGroupAssignment(playerGroups, signedGames);
    if (isErrorResult(resultAsyncResult)) {
      return resultAsyncResult;
    }

    const result = unwrapResult(resultAsyncResult);

    if (result.score > bestScore) {
      bestScore = result.score;
      bestResult = result.signupResults;
      players = result.playerCounter;
      games = result.gameCounter;
      logger.debug(`New best score: ${bestScore}`);
    }
  }

  const returnMessage = `Group Assign Result - Players: ${players}/${
    selectedPlayers.length
  } (${Math.round(
    (players / selectedPlayers.length) * 100
  )}%), Games: ${games}/${signedGames.length} (${Math.round(
    (games / signedGames.length) * 100
  )}%)`;

  return makeSuccessResult({ results: bestResult, message: returnMessage });
};
