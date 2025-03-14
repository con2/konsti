import { assignPadg } from "server/features/assignment/padg/utils/assignPadg";
import { getGroups } from "server/features/assignment/utils/getGroups";
import { getList } from "server/features/assignment/utils/getList";
import { getEvents } from "server/features/assignment/utils/getEvents";
import { formatResults } from "server/features/assignment/utils/formatResults";
import { AssignmentAlgorithmResult, Input } from "server/types/resultTypes";
import { ProgramItem } from "shared/types/models/programItem";
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

const updateL = (input: Input): string => input.list;

export const runPadgAssignment = (
  lotterySignupProgramItems: readonly ProgramItem[],
  attendeeGroups: readonly User[][],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentAlgorithmResult, AssignmentError> => {
  const groupsResult = getGroups(attendeeGroups, startTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getEvents(lotterySignupProgramItems, directSignups);
  const listResult = getList({
    attendeeGroups,
    startTime,
    directSignups,
    lotterySignupProgramItems,
  });
  if (isErrorResult(listResult)) {
    return listResult;
  }
  const list = unwrapResult(listResult);

  logger.debug("PADG assignment: start");
  const assignResults = assignPadg(groups, events, list, updateL);
  logger.debug("PADG assignment: completed");

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!assignResults) {
    logger.error(
      "%s",
      new Error(
        `Padg assignment for start time ${startTime} failed with input: groups: ${JSON.stringify(
          groups,
        )}, events: ${JSON.stringify(events)}, list: ${JSON.stringify(
          list,
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        )}, updateL: ${updateL}`,
      ),
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  const resultsResult = formatResults(assignResults, attendeeGroups);
  if (isErrorResult(resultsResult)) {
    return resultsResult;
  }

  const results = unwrapResult(resultsResult);
  const message = "Padg assignment completed";

  return makeSuccessResult({ results, message });
};
