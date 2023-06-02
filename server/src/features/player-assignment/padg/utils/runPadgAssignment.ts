import { assignPadg } from "server/features/player-assignment/padg/utils/assignPadg";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getEvents } from "server/features/player-assignment/utils/getEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { AssignmentStrategyResult, Input } from "server/typings/result.typings";
import { Game } from "shared/typings/models/game";
import { User } from "shared/typings/models/user";
import { Signup } from "server/features/signup/signup.typings";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/typings/api/errors";
import { logger } from "server/utils/logger";

export const runPadgAssignment = (
  signedGames: readonly Game[],
  playerGroups: readonly User[][],
  startingTime: string,
  signups: readonly Signup[]
): Result<AssignmentStrategyResult, AssignmentError> => {
  const groupsResult = getGroups(playerGroups, startingTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getEvents(signedGames);
  const listResult = getList(playerGroups, startingTime, signups);
  if (isErrorResult(listResult)) {
    return listResult;
  }
  const list = unwrapResult(listResult);
  const updateL = (input: Input): string => input.list;

  const assignResults = assignPadg(groups, events, list, updateL);

  if (!assignResults) {
    logger.error(
      `Padg assignment failed with input: groups: ${JSON.stringify(
        groups
      )}, events: ${JSON.stringify(events)}, list: ${JSON.stringify(
        list
      )}, updateL: ${updateL}`
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const resultsResult = formatResults(assignResults, playerGroups);
  if (isErrorResult(resultsResult)) {
    return resultsResult;
  }

  const results = unwrapResult(resultsResult);
  const message = "Padg assignment completed";

  return makeSuccessResult({ results, message });
};
