import { UserModel } from "server/features/user/userSchema";
import { UserLotterySignups } from "server/types/resultTypes";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { LotterySignup, User } from "shared/types/models/user";
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

interface SaveLotterySignupParams {
  lotterySignup: LotterySignup;
  username: string;
}

export const saveLotterySignup = async ({
  lotterySignup,
  username,
}: SaveLotterySignupParams): Promise<Result<User, MongoDbError>> => {
  try {
    const signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        $addToSet: {
          lotterySignups: {
            programItemId: lotterySignup.programItemId,
            priority: lotterySignup.priority,
            time: lotterySignup.time,
            message: lotterySignup.message,
          },
        },
      },
      { new: true },
    );
    if (!signupResponse) {
      logger.error(
        "%s",
        new Error(
          `Error saving lottery signup ${lotterySignup.programItemId} for user ${username}, user not found`,
        ),
      );
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(
      `MongoDB: Lottery signup ${lotterySignup.programItemId} saved for user ${username}`,
    );
    return makeSuccessResult(signupResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error saving lottery signup ${lotterySignup.programItemId} for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface DeleteLotterySignupParams {
  lotterySignupProgramItemId: string;
  username: string;
}

export const delLotterySignup = async ({
  lotterySignupProgramItemId,
  username,
}: DeleteLotterySignupParams): Promise<Result<User, MongoDbError>> => {
  try {
    const signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        $pull: {
          lotterySignups: {
            programItemId: lotterySignupProgramItemId,
          },
        },
      },
      { new: true },
    );
    if (!signupResponse) {
      logger.error(
        "%s",
        new Error(
          `Error deleting lottery signup ${lotterySignupProgramItemId} from user ${username}, user not found`,
        ),
      );
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(
      `MongoDB: Lottery signup ${lotterySignupProgramItemId} deleted from user ${username}`,
    );
    return makeSuccessResult(signupResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting lottery signup ${lotterySignupProgramItemId} from user ${username}: %s`,
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
