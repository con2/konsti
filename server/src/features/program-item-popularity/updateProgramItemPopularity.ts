import dayjs from "dayjs";
import { countBy, groupBy } from "remeda";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
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
    (programItem) => {
      const parentStartTime = config
        .event()
        .startTimesByParentIds.get(programItem.parentId);
      return dayjs(parentStartTime ?? programItem.startTime).toISOString();
    },
  );

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  const futureStartTimes = Object.keys(programItemsByStartTimes).filter(
    (startTime) => dayjs(startTime).isSameOrAfter(timeNowResult.value),
  );

  // TODO: Only update popularity for startTimes where lottery sign-up is open
  const assignmentResults = futureStartTimes.map((startTime) => {
    const result = runAssignmentAlgorithm(
      config.event().assignmentAlgorithm,
      validLotterySignupsUsers,
      validLotterySignupProgramItems,
      startTime,
      lotteryParticipantDirectSignups,
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
