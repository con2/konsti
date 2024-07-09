import { eventAssignment } from "eventassigner-random";
import { AssignmentElement } from "eventassigner-random/lib/typings/assignment";
import { CheckResult } from "eventassigner-random/lib/typings/checkResult";
import { config } from "shared/config";
import { getGroups } from "server/features/assignment/utils/getGroups";
import { getList } from "server/features/assignment/utils/getList";
import { getRandomAssignEvents } from "server/features/assignment/random/utils/getRandomAssignEvents";
import { formatResults } from "server/features/assignment/utils/formatResults";
import { ProgramItem } from "shared/types/models/programItem";
import { AssignmentStrategyResult } from "server/types/resultTypes";
import {
  ListItem,
  RandomAssignUpdateLInput,
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
  lotterySignupProgramItems: readonly ProgramItem[],
  attendeeGroups: readonly User[][],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentStrategyResult, AssignmentError> => {
  const groupsResult = getGroups(attendeeGroups, startTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getRandomAssignEvents(
    lotterySignupProgramItems,
    directSignups,
  );
  const listResult = getList(
    attendeeGroups,
    startTime,
    directSignups,
    lotterySignupProgramItems,
  );
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

  let assignResults: AssignmentElement[] | CheckResult | undefined;
  try {
    assignResults = eventAssignment(input);
  } catch (error) {
    logger.error(
      "%s",
      new Error(
        `Random assignment failed: ${error}. Start time: ${startTime}, Input: ${JSON.stringify(input)}`,
      ),
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  // CheckResult = invalid result
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

  const resultsResult = formatResults(assignResults, attendeeGroups);
  if (isErrorResult(resultsResult)) {
    return resultsResult;
  }

  const results = unwrapResult(resultsResult);
  const message = "Random assignment completed";

  return makeSuccessResult({ results, message });
};

const isCheckResult = (
  assignResults: AssignmentElement[] | CheckResult,
): assignResults is CheckResult => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (assignResults as CheckResult).value !== undefined;
};
