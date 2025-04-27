import { UserModel } from "server/features/user/userSchema";
import { UserLotterySignups } from "server/types/resultTypes";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const saveLotterySignups = async (
  signupData: UserLotterySignups,
): Promise<Result<User, MongoDbError>> => {
  const { lotterySignups, username } = signupData;

  try {
    const signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        lotterySignups,
      },
      { new: true },
    );
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
