import { eventAssignment } from "eventassigner-random";
import { CheckResult } from "eventassigner-random/lib/typings/checkResult";
import { config } from "shared/config";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getRandomAssignEvents } from "server/features/player-assignment/random/utils/getRandomAssignEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { Game } from "shared/types/models/game";
import { AssignmentStrategyResult } from "server/types/resultTypes";
import {
  ListItem,
  RandomAssignUpdateLInput,
  PadgRandomAssignResults,
} from "server/types/padgRandomAssignTypes";
import { User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { logger } from "server/utils/logger";

export const runRandomAssignment = (
  selectedGames: readonly Game[],
  playerGroups: readonly User[][],
  startTime: string,
  signups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentStrategyResult, AssignmentError> => {
  const groupsResult = getGroups(playerGroups, startTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getRandomAssignEvents(selectedGames, signups);
  const listResult = getList(playerGroups, startTime, signups);
  if (isErrorResult(listResult)) {
    return listResult;
  }
  const list = unwrapResult(listResult);
  const updateL = (input: RandomAssignUpdateLInput): ListItem[] => input.L;

  const { RANDOM_ASSIGNMENT_ROUNDS } = config.server();
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
      "%s",
      new Error(
        `Random assignment failed: ${
          assignResults.msg
        }. Input: ${JSON.stringify(input)}`,
      ),
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
  assignResults: PadgRandomAssignResults | CheckResult,
): assignResults is CheckResult => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (assignResults as CheckResult).value !== undefined;
};
