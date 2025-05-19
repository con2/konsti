import dayjs from "dayjs";
import { countBy, groupBy } from "remeda";
import {
  findProgramItems,
  saveProgramItemPopularity,
} from "server/features/program-item/programItemRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { config } from "shared/config";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { findUsers } from "server/features/user/userRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";
import { logger } from "server/utils/logger";

export const updateProgramItemPopularity = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Calculate program item popularity");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryValidDirectSignups,
  } = prepareAssignmentParams(users, programItems, directSignups);

  const programItemsForStartTimes = groupBy(
    validLotterySignupProgramItems,
    (programItem) => dayjs(programItem.startTime).toISOString(),
  );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }
  const timeNow = unwrapResult(timeNowResult);

  const futureStartTimes = Object.keys(programItemsForStartTimes).filter(
    (startTime) => dayjs(startTime).isSameOrAfter(timeNow),
  );

  // TODO: Only update popularity for startTimes where lottery signup is open
  const assignmentResults = futureStartTimes.map((startTime) => {
    const result = runAssignmentAlgorithm(
      config.event().assignmentAlgorithm,
      validLotterySignupsUsers,
      validLotterySignupProgramItems,
      startTime,
      lotteryValidDirectSignups,
    );
    return { result, startTime };
  });

  const successResults = assignmentResults.flatMap((assignmentResult) => {
    if (isErrorResult(assignmentResult.result)) {
      logger.error(
        "%s",
        new Error(
          `Popularity update: assignment for start time ${assignmentResult.startTime} failed: ${assignmentResult.result.error}`,
        ),
      );
      return [];
    }
    return unwrapResult(assignmentResult.result);
  });

  const results = successResults.flatMap((result) => result.results);

  const assignmentSignupsProgramItemIds = results.map(
    (result) => result.assignmentSignup.programItemId,
  );

  const groupedSignups = countBy(assignmentSignupsProgramItemIds, (id) => id);

  const programItemPopularityUpdates = validLotterySignupProgramItems
    .map((programItem) => ({
      programItemId: programItem.programItemId,
      popularity: groupedSignups[programItem.programItemId],
    }))
    .filter((popularityUpdate) => popularityUpdate.popularity);

  const saveProgramItemPopularityResult = await saveProgramItemPopularity(
    programItemPopularityUpdates,
  );

  if (isErrorResult(saveProgramItemPopularityResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info("Program item popularity updated");

  return makeSuccessResult();
};
