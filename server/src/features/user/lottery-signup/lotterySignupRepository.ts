import { findProgramItems } from "server/features/program-item/programItemRepository";
import { UserModel } from "server/features/user/userSchema";
import { NewLotterySignup, UserLotterySignups } from "server/types/resultTypes";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const saveLotterySignups = async (
  signupData: UserLotterySignups,
): Promise<Result<User, MongoDbError>> => {
  const { lotterySignups, username } = signupData;

  const programItemsResult = await findProgramItems();

  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }

  const programItems = unwrapResult(programItemsResult);

  const formattedData = lotterySignups.reduce<NewLotterySignup[]>(
    (acc, lotterySignup) => {
      const programItemDocInDb = programItems.find(
        (programItem) =>
          programItem.programItemId === lotterySignup.programItem.programItemId,
      );

      if (programItemDocInDb?._id) {
        acc.push({
          programItem: programItemDocInDb._id,
          priority: lotterySignup.priority,
          time: lotterySignup.time,
          message: lotterySignup.message,
        });
      }
      return acc;
    },
    [],
  );

  try {
    const signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        lotterySignups: formattedData,
      },
      { new: true, fields: "-lotterySignups._id" },
    ).populate("lotterySignups.programItem");
    if (!signupResponse) {
      logger.error("%s", new Error("Error saving lottery signups"));
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(`MongoDB: Signup data stored for user ${username}`);
    return makeSuccessResult(signupResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup data for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const removeLotterySignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { lotterySignups: [] });
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing lottery signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
