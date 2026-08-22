import { isBefore } from "date-fns";
import { countBy, groupBy } from "remeda";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  getLotterySignupEndTime,
  getProgramItemStartTime,
} from "shared/utils/signupTimes";
import { isSameOrAfter } from "shared/utils/timeComparison";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { getPopularity } from "server/features/program-item-popularity/getPopularity";
import {
  findProgramItems,
  saveProgramItemPopularity,
} from "server/features/program-item/programItemRepository";
import { findUsers } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";

export const updateProgramItemPopularity = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Calculate program item popularity");

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }

  const directSignupsResult = await findDirectSignups();
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }

  const {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryParticipantDirectSignups,
  } = prepareAssignmentParams(
    usersResult.value,
    programItemsResult.value,
    directSignupsResult.value,
  );

  const programItemsByStartTimes = groupBy(
    validLotterySignupProgramItems,
    (programItem) =>
      new Date(getProgramItemStartTime(programItem)).toISOString(),
  );

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  // Only start times whose lottery sign-up is still open. Popularity is a measure of demand
  // for the lottery, and the numbers it is derived from stop meaning that the moment the
  // lottery has run: capacity is reduced by the spots just handed out while every attendee
  // still competes for what is left, so a partly filled program item can simulate below its
  // minimum attendance and be written down as LOW, and the attendees displaced from a full
  // one inflate its siblings. A start time is never simulated again once it has passed, so
  // whatever is written in that window is what the program item keeps for the rest of the
  // event. Simulating only before the lottery keeps every figure a full-capacity one
  const openLotteryStartTimes = Object.keys(programItemsByStartTimes).filter(
    (startTime) => {
      const programItemsForStartTime = programItemsByStartTimes[startTime];
      const lotterySignupEndTime = getLotterySignupEndTime(
        // Every program item in the group shares the start time the window is derived from
        programItemsForStartTime[0],
      );
      return (
        isSameOrAfter(new Date(startTime), timeNowResult.value) &&
        isBefore(timeNowResult.value, lotterySignupEndTime)
      );
    },
  );

  const assignmentResults = openLotteryStartTimes.map((startTime) => {
    const result = runAssignmentAlgorithm(
      config.event().assignmentAlgorithm,
      validLotterySignupsUsers,
      validLotterySignupProgramItems,
      startTime,
      lotteryParticipantDirectSignups,
      // Popularity measures demand, not who is already placed. Nothing has been placed for
      // these start times yet, so nobody is settled and every attendee competes for the
      // program item's full capacity
      new Set(),
    );
    return { result, startTime };
  });

  const successResults = assignmentResults.flatMap((assignmentResult) => {
    if (!assignmentResult.result.ok) {
      logger.error(
        new Error(
          `Popularity update: assignment for start time ${assignmentResult.startTime} failed: ${assignmentResult.result.error}`,
        ),
      );
      return [];
    }
    return assignmentResult.result.value;
  });

  const userAssignmentProgramIds = successResults
    .flatMap((result) => result.results)
    .map((result) => result.assignmentSignup.programItemId);
  const programItemSignupsCounts = countBy(
    userAssignmentProgramIds,
    (id) => id,
  );

  const lotterySignups = validLotterySignupsUsers.flatMap(
    (user) => user.lotterySignups,
  );
  const groupedLotterySignups = groupBy(
    lotterySignups,
    (signup) => signup.programItemId,
  );

  const programItemPopularityUpdates = Object.entries(
    programItemSignupsCounts,
  ).flatMap(([programItemId, assignmentSignupCount]) => {
    const programItem = validLotterySignupProgramItems.find(
      (item) => item.programItemId === programItemId,
    );
    if (!programItem) {
      return [];
    }

    return {
      programItemId,
      popularity: getPopularity({
        minAttendance: programItem.minAttendance,
        maxAttendance: programItem.maxAttendance,
        assignmentSignupCount,
        lotterySignups: groupedLotterySignups[programItemId],
      }),
    };
  });

  const saveProgramItemPopularityResult = await saveProgramItemPopularity(
    programItemPopularityUpdates,
  );
  if (!saveProgramItemPopularityResult.ok) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info("Program item popularity updated");

  return makeSuccessResult();
};
