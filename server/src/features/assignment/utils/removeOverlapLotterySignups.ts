import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { findUsers } from "server/features/user/userRepository";
import { UserAssignmentResult } from "shared/types/models/result";
import {
  DeleteLotterySignupsParams,
  delLotterySignups,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";

export const removeOverlapLotterySignups = async (
  results: readonly UserAssignmentResult[],
  programItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.debug("Find overlapping lottery signups");
  const usersToUpdate: DeleteLotterySignupsParams[] = [];

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  results.flatMap((result) => {
    const assignmentSignupProgramItem = programItems.find(
      (programItem) =>
        programItem.programItemId === result.assignmentSignup.programItemId,
    );

    if (!assignmentSignupProgramItem) {
      logger.error(
        "%s",
        new Error(
          `removeOverlapLotterySignups: Error finding assignment signup: ${result.assignmentSignup.programItemId}`,
        ),
      );
      return [];
    }

    const signedUser = users.find((user) => user.username === result.username);
    if (!signedUser) {
      logger.error(
        "%s",
        new Error(
          `removeOverlapLotterySignups: Error finding signed user: ${result.username}`,
        ),
      );
      return [];
    }

    // Cancel all lottery signups that start during the lottery direct signup
    const overlappingLotterySignups = signedUser.lotterySignups.filter(
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );
        if (!foundProgramItem) {
          return false;
        }
        const startsDuring = dayjs(foundProgramItem.startTime).isBetween(
          dayjs(assignmentSignupProgramItem.startTime).add(1, "minutes"),
          dayjs(assignmentSignupProgramItem.endTime),
        );
        return startsDuring;
      },
    );

    // Only update users with overlapping signups
    if (overlappingLotterySignups.length > 0) {
      usersToUpdate.push({
        username: signedUser.username,
        lotterySignupProgramItemIds: overlappingLotterySignups.map(
          (signup) => signup.programItemId,
        ),
      });
    }
  });

  const delLotterySignupsResult = await delLotterySignups(usersToUpdate);
  if (isErrorResult(delLotterySignupsResult)) {
    return delLotterySignupsResult;
  }

  return makeSuccessResult();
};
