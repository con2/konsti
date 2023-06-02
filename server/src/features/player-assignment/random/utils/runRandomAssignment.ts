import { eventAssignment } from "eventassigner-random";
import { CheckResult } from "eventassigner-random/lib/typings/checkResult";
import { config } from "server/config";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getRandomAssignEvents } from "server/features/player-assignment/random/utils/getRandomAssignEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { Game } from "shared/typings/models/game";
import { AssignmentStrategyResult } from "server/typings/result.typings";
import {
  ListItem,
  RandomAssignUpdateLInput,
  PadgRandomAssignResults,
} from "server/typings/padgRandomAssign.typings";
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

export const runRandomAssignment = (
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
  const events = getRandomAssignEvents(signedGames);
  const listResult = getList(playerGroups, startingTime, signups);
  if (isErrorResult(listResult)) {
    return listResult;
  }
  const list = unwrapResult(listResult);
  const updateL = (input: RandomAssignUpdateLInput): ListItem[] => input.L;

  const { RANDOM_ASSIGNMENT_ROUNDS } = config;
  const input = {
    groups,
    events,
    L: list,
    updateL,
    assignmentRounds: RANDOM_ASSIGNMENT_ROUNDS,
  };

  const assignResults = eventAssignment(input);

  if (isCheckResult(assignResults)) {
    logger.error(
      `Random assignment failed: ${assignResults.msg}. Input: ${JSON.stringify(
        input
      )}`
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const resultsResult = formatResults(assignResults, playerGroups);
  if (isErrorResult(resultsResult)) {
    return resultsResult;
  }

  const results = unwrapResult(resultsResult);
  const message = "Random assignment completed";

  return makeSuccessResult({ results, message });
};

const isCheckResult = (
  assignResults: PadgRandomAssignResults | CheckResult
): assignResults is CheckResult => {
  return (assignResults as CheckResult).value !== undefined;
};
