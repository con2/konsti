import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // ES 2015
import { logger } from "server/utils/logger";
import { UserLotterySignups } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { AssignmentResult } from "shared/types/models/result";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

// TODO: Can this be deleted?
dayjs.extend(isBetween);

export const removeOverlapSignups = async (
  results: readonly AssignmentResult[],
): Promise<Result<void, MongoDbError>> => {
  logger.debug("Find overlapping signups");
  const signupData: UserLotterySignups[] = [];

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  results.map((result) => {
    const directSignupProgramItem = result.directSignup.programItemDetails;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!directSignupProgramItem) {
      logger.error(
        "%s",
        new Error("removeOverlapSignups: Error finding direct signup"),
      );
      return;
    }

    const signedUser = users.find((user) => user.username === result.username);
    if (!signedUser) {
      logger.error(
        "%s",
        new Error("removeOverlapSignups: Error finding signed user"),
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const newLotterySignups = signedUser?.lotterySignups.filter(
      (lotterySignup) => {
        // If lottery signup takes place during the length of direct signup program item, cancel it
        return !dayjs(lotterySignup.programItemDetails.startTime).isBetween(
          dayjs(directSignupProgramItem.startTime).add(1, "minutes"),
          dayjs(directSignupProgramItem.endTime),
        );
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!newLotterySignups) {
      logger.error(
        "%s",
        new Error("removeOverlapSignups: Error finding lottery signups"),
      );
      return;
    }

    signupData.push({
      username: signedUser.username,
      lotterySignups: newLotterySignups,
    });
  });

  const promises = signupData.map(async (signup) => {
    const saveLotterySignupsResult = await saveLotterySignups(signup);
    if (isErrorResult(saveLotterySignupsResult)) {
      return saveLotterySignupsResult;
    }
    return makeSuccessResult(undefined);
  });

  const saveResults = await Promise.all(promises);
  const someResultFailed = saveResults.some((saveResult) =>
    isErrorResult(saveResult),
  );
  if (someResultFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
