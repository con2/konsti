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
import { LotterySignup } from "shared/types/models/user";
import { Popularity } from "shared/types/models/programItem";

interface GetPopularityParams {
  minAttendance: number;
  maxAttendance: number;
  assignmentPopularity: number;
  lotterySignups: LotterySignup[];
}

const getPopularity = ({
  minAttendance,
  maxAttendance,
  assignmentPopularity,
  lotterySignups,
}: GetPopularityParams): Popularity => {
  // Use assignment result when popularity is not maximum
  if (assignmentPopularity < minAttendance) {
    return Popularity.LOW;
  }
  if (
    assignmentPopularity >= minAttendance &&
    assignmentPopularity < maxAttendance
  ) {
    return Popularity.MEDIUM;
  }

  // When assignment popularity is maximum, we need to use additional modifier to determine HIGH, VERY_HIGH and CRITICAL
  const priority1 = lotterySignups.filter((signup) => signup.priority === 1);
  const priority2 = lotterySignups.filter((signup) => signup.priority === 2);
  const priority3 = lotterySignups.filter((signup) => signup.priority === 3);

  const modifier =
    (priority1.length + priority2.length / 2 + priority3.length / 3) /
    maxAttendance;

  if (modifier >= 5) {
    return Popularity.EXTREME;
  }

  if (modifier >= 3) {
    return Popularity.VERY_HIGH;
  }

  return Popularity.HIGH;
};

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

  const programItemsByStartTimes = groupBy(
    validLotterySignupProgramItems,
    (programItem) => dayjs(programItem.startTime).toISOString(),
  );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }
  const timeNow = unwrapResult(timeNowResult);

  const futureStartTimes = Object.keys(programItemsByStartTimes).filter(
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
  ).flatMap(([programItemId, assignmentPopularity]) => {
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
        assignmentPopularity,
        lotterySignups: groupedLotterySignups[programItemId],
      }),
    };
  });

  const saveProgramItemPopularityResult = await saveProgramItemPopularity(
    programItemPopularityUpdates,
  );
  if (isErrorResult(saveProgramItemPopularityResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info("Program item popularity updated");

  return makeSuccessResult();
};
