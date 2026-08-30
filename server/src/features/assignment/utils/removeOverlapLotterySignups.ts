import { addMinutes } from "date-fns";
import { config } from "shared/config";
import { RemoveLotterySignupsStrategy } from "shared/config/eventConfigTypes";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { Result, makeSuccessResult } from "shared/utils/result";
import { isBetweenExclusive } from "shared/utils/timeComparison";
import { getUpcomingLotterySignupProgramItemIds } from "server/features/assignment/utils/getUpcomingLotterySignups";
import {
  DeleteLotterySignupsParams,
  delLotterySignups,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";

export const removeOverlapLotterySignups = async (
  results: readonly UserAssignmentResult[],
  programItems: readonly ProgramItem[],
  assignmentTime: string,
): Promise<Result<void, MongoDbError>> => {
  logger.debug("Find overlapping lottery signups");
  const usersToUpdate: DeleteLotterySignupsParams[] = [];

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }
  results.flatMap((result) => {
    const assignmentSignupProgramItem = programItems.find(
      (programItem) =>
        programItem.programItemId === result.assignmentSignup.programItemId,
    );

    if (!assignmentSignupProgramItem) {
      logger.error(
        new Error(
          `removeOverlapLotterySignups: Error finding assignment signup: ${result.assignmentSignup.programItemId}`,
        ),
      );
      return [];
    }

    const signedUser = usersResult.value.find(
      (user) => user.username === result.username,
    );
    if (!signedUser) {
      logger.error(
        new Error(
          `removeOverlapLotterySignups: Error finding signed user: ${result.username}`,
        ),
      );
      return [];
    }

    // Both branches below pick out program items starting after the one just won, so their
    // lotteries are still ahead and nothing here can remove a sign-up whose lottery has run

    // Cancel all lottery sign-ups that start during the lottery direct sign-up
    if (
      config.event().removeLotterySignupsStrategy ===
      RemoveLotterySignupsStrategy.OVERLAP
    ) {
      logger.info("Remove overlapping signups");
      const overlappingLotterySignups = signedUser.lotterySignups.filter(
        (lotterySignup) => {
          const foundProgramItem = programItems.find(
            (programItem) =>
              programItem.programItemId === lotterySignup.programItemId,
          );
          if (!foundProgramItem) {
            return false;
          }
          const startsDuring = isBetweenExclusive(
            new Date(foundProgramItem.startTime),
            addMinutes(new Date(assignmentSignupProgramItem.startTime), 1),
            new Date(assignmentSignupProgramItem.endTime),
          );
          return startsDuring;
        },
      );

      // Only update users with overlapping lottery sign-ups
      if (overlappingLotterySignups.length > 0) {
        usersToUpdate.push({
          username: signedUser.username,
          lotterySignupProgramItemIds: overlappingLotterySignups.map(
            (signup) => signup.programItemId,
          ),
        });
      }
    }

    // Cancel all upcoming lottery sign-ups
    if (
      config.event().removeLotterySignupsStrategy ===
      RemoveLotterySignupsStrategy.ALL_UPCOMING
    ) {
      logger.info("Remove upcoming signups");
      const upcomingLotterySignupProgramItemIds =
        getUpcomingLotterySignupProgramItemIds(
          signedUser.lotterySignups,
          programItems,
          new Date(assignmentTime),
        );

      // Only update users with upcoming lottery sign-ups
      if (upcomingLotterySignupProgramItemIds.length > 0) {
        usersToUpdate.push({
          username: signedUser.username,
          lotterySignupProgramItemIds: upcomingLotterySignupProgramItemIds,
        });
      }
    }
  });

  if (usersToUpdate.length > 0) {
    const delLotterySignupsResult = await delLotterySignups(usersToUpdate);
    if (!delLotterySignupsResult.ok) {
      return delLotterySignupsResult;
    }
  }

  return makeSuccessResult();
};
