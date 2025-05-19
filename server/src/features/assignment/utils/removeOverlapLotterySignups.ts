import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { UserLotterySignups } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
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
  const signupData: UserLotterySignups[] = [];

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  results.flatMap((result) => {
    const directSignupProgramItem = programItems.find(
      (programItem) =>
        programItem.programItemId === result.directSignup.programItemId,
    );

    if (!directSignupProgramItem) {
      logger.error(
        "%s",
        new Error(
          `removeOverlapLotterySignups: Error finding direct signup: ${result.directSignup.programItemId}`,
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
    const newLotterySignups = signedUser.lotterySignups.filter(
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );
        if (!foundProgramItem) {
          return false;
        }
        return !dayjs(foundProgramItem.startTime).isBetween(
          dayjs(directSignupProgramItem.startTime).add(1, "minutes"),
          dayjs(directSignupProgramItem.endTime),
        );
      },
    );

    // Only update users whose lottery signups changed
    if (signedUser.lotterySignups.length !== newLotterySignups.length) {
      signupData.push({
        username: signedUser.username,
        lotterySignups: newLotterySignups,
      });
    }
  });

  const promises = signupData.map(async (signup) => {
    const saveLotterySignupsResult = await saveLotterySignups(signup);
    if (isErrorResult(saveLotterySignupsResult)) {
      return saveLotterySignupsResult;
    }
    return makeSuccessResult();
  });

  const saveResults = await Promise.all(promises);
  const someResultFailed = saveResults.some((saveResult) =>
    isErrorResult(saveResult),
  );
  if (someResultFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult();
};
