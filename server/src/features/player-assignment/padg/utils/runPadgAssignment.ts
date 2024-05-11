import { assignPadg } from "server/features/player-assignment/padg/utils/assignPadg";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getEvents } from "server/features/player-assignment/utils/getEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { AssignmentStrategyResult, Input } from "server/types/resultTypes";
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

export const runPadgAssignment = (
  lotterySignupProgramItems: readonly ProgramItem[],
  playerGroups: readonly User[][],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentStrategyResult, AssignmentError> => {
  const groupsResult = getGroups(playerGroups, startTime);
  if (isErrorResult(groupsResult)) {
    return groupsResult;
  }
  const groups = unwrapResult(groupsResult);
  const events = getEvents(lotterySignupProgramItems, directSignups);
  const listResult = getList(playerGroups, startTime, directSignups);
  if (isErrorResult(listResult)) {
    return listResult;
  }
  const list = unwrapResult(listResult);
  const updateL = (input: Input): string => input.list;

  const assignResults = assignPadg(groups, events, list, updateL);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!assignResults) {
    logger.error(
      "%s",
      new Error(
        `Padg assignment failed with input: groups: ${JSON.stringify(
          groups,
        )}, events: ${JSON.stringify(events)}, list: ${JSON.stringify(
          list,
        )}, updateL: ${updateL}`,
      ),
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
