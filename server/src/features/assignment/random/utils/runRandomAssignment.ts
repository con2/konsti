import { eventAssignment } from "eventassigner-random";
import { AssignmentElement } from "eventassigner-random/lib/typings/assignment";
import { CheckResult } from "eventassigner-random/lib/typings/checkResult";
import { config } from "shared/config";
import { getGroups } from "server/features/assignment/utils/getGroups";
import { getList } from "server/features/assignment/utils/getList";
import { formatResults } from "server/features/assignment/utils/formatResults";
import { ProgramItem } from "shared/types/models/programItem";
import { AssignmentAlgorithmResult } from "server/types/resultTypes";
import {
  ListItem,
  RandomAssignUpdateLInput,
} from "server/types/assignmentTypes";
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
import { calculateHappiness } from "server/features/assignment/padg/utils/calculateHappiness";
import { getEvents } from "server/features/assignment/utils/getEvents";

const updateL = (input: RandomAssignUpdateLInput): ListItem[] => input.L;

export const runRandomAssignment = (
  lotterySignupProgramItems: readonly ProgramItem[],
  attendeeGroups: readonly User[][],
  startTime: string,
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentAlgorithmResult, AssignmentError> => {
  const groupsResult = getGroups(attendeeGroups, startTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getEvents(
    lotterySignupProgramItems,
    lotteryValidDirectSignups,
  );
  const list = getList({
    attendeeGroups,
    startTime,
    lotteryValidDirectSignups,
    lotterySignupProgramItems,
  });

  const { randomAssignmentRounds } = config.server();
  const input = {
    groups,
    events,
    L: list,
    updateL,
    assignmentRounds: randomAssignmentRounds,
  };

  let assignResults: AssignmentElement[] | CheckResult | undefined;
  try {
    logger.debug("Run random algorithm: start");
    assignResults = eventAssignment(input);
    logger.debug("Run random algorithm: finished");
  } catch (error) {
    logger.error(
      "%s",
      new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
  const happiness = calculateHappiness(assignResults, groups);
  const message = `Random assignment completed with happiness ${happiness}%`;
  logger.debug(message);

  return makeSuccessResult({ results, message });
};

const isCheckResult = (
  assignResults: AssignmentElement[] | CheckResult,
): assignResults is CheckResult => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (assignResults as CheckResult).value !== undefined;
};
