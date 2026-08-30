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
  willNotBeLotteried,
} from "shared/utils/signupTimes";
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

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  // Simulating a program item no lottery will take would spend attendees' placements on it
  // rather than on the ones a lottery is still coming for. Its stored figure stays as it is
  const lotteryProgramItems = validLotterySignupProgramItems.filter(
    (programItem) => !willNotBeLotteried(programItem),
  );

  const programItemsByStartTimes = groupBy(lotteryProgramItems, (programItem) =>
    new Date(getProgramItemStartTime(programItem)).toISOString(),
  );

  // Only start times whose lottery sign-up is still open. Popularity measures demand for the
  // lottery, and once spots have been handed out the simulation no longer measures that -
  // reduced capacity with every attendee still competing understates some items and inflates
  // others. A start time is never simulated again, so a figure written then is kept for good
  const openLotteryStartTimes = Object.keys(programItemsByStartTimes).filter(
    (startTime) => {
      const programItemsForStartTime = programItemsByStartTimes[startTime];
      const lotterySignupEndTime = getLotterySignupEndTime(
        // Every program item in the group shares the start time the window is derived from
        programItemsForStartTime[0],
      );
      return isBefore(timeNowResult.value, lotterySignupEndTime);
    },
  );

  const assignmentResults = openLotteryStartTimes.map((startTime) => {
    const result = runAssignmentAlgorithm(
      config.event().assignmentAlgorithm,
      validLotterySignupsUsers,
      lotteryProgramItems,
      startTime,
      lotteryParticipantDirectSignups,
      programItemsResult.value,
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
    const programItem = lotteryProgramItems.find(
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
