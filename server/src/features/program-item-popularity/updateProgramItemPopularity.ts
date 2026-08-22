import { countBy, groupBy } from "remeda";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
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
  const futureStartTimes = Object.keys(programItemsByStartTimes).filter(
    (startTime) => isSameOrAfter(new Date(startTime), timeNowResult.value),
  );

  // TODO: Only update popularity for startTimes where lottery sign-up is open
  const assignmentResults = futureStartTimes.map((startTime) => {
    const result = runAssignmentAlgorithm(
      config.event().assignmentAlgorithm,
      validLotterySignupsUsers,
      validLotterySignupProgramItems,
      startTime,
      lotteryParticipantDirectSignups,
      // Popularity measures demand, not who is already placed. This start time's lottery
      // may have run already - the cron keeps simulating it until it starts - and letting
      // the placed attendees sit it out would report a full program item as unwanted
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
