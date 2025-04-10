import eventassigner from "eventassigner-js";
import { cloneDeep, sortBy } from "lodash-es";
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
import {
  PadgInput,
  ListItem,
  Event,
  PadgRandomAssignResult,
  PadgError,
} from "server/types/assignmentTypes";
import { config } from "shared/config";
import { calculateHappiness } from "server/features/assignment/padg/utils/calculateHappiness";

const sortList = (list: ListItem[], i: number): ListItem[] => {
  switch (i) {
    case 0:
      return sortBy(list, "gain");
    case 1:
      return sortBy(list, "size");
    default:
      return list.sort((_a, _b) => 0.5 - Math.random());
  }
};

const updateL = (input: Input): string => input.list;

export const runPadgAssignment = (
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

  logger.debug("PADG assignment: start");
  const { padgAssignmentRounds } = config.server();

  let finalHappiness = 0;
  let finalAssignResults: PadgRandomAssignResult[] = [];

  for (let i = 0; i < padgAssignmentRounds; i++) {
    logger.debug(`PADG algorithm round ${i + 1}`);

    // Bug in eventassigner-js: mutates input array
    const eventsCopy = cloneDeep(events);

    const input: PadgInput = {
      groups,
      events: eventsCopy,
      list: sortList(list, i),
      updateL,
    };

    let assignResults: PadgRandomAssignResult[] | PadgError | undefined;

    try {
      logger.debug("Run PADG algorithm: start");
      assignResults = eventassigner.eventAssignment(input);
      logger.debug("Run PADG algorithm: finished");
    } catch (error) {
      logger.error(
        "%s",
        new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Padg assignment round failed: ${error}. Input: ${JSON.stringify(input)}`,
        ),
      );
    }

    // Skip error results
    if (!Array.isArray(assignResults)) {
      continue;
    }

    const happiness = calculateHappiness(assignResults, groups);

    if (happiness > finalHappiness) {
      finalHappiness = happiness;
      finalAssignResults = assignResults;
    }
  }

  logger.debug(`Padg assignment completed with happiness ${finalHappiness}%`);

  logger.debug("PADG assignment: completed");

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!finalAssignResults) {
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

  const resultsResult = formatResults(finalAssignResults, attendeeGroups);
  if (isErrorResult(resultsResult)) {
    return resultsResult;
  }

  const results = unwrapResult(resultsResult);
  const message = "Padg assignment completed";

  return makeSuccessResult({ results, message });
};
