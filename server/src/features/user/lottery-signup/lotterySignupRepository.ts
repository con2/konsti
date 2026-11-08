import { MongoDbError } from "shared/types/api/errors";
import { LotterySignup, User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { UserLotterySignups } from "server/types/resultTypes";
import { logger } from "server/utils/logger";

export const saveLotterySignups = async (
  signupData: UserLotterySignups,
): Promise<Result<User, MongoDbError>> => {
  const { lotterySignups, userId } = signupData;

  try {
    const response = await UserModel.findOneAndUpdate(
      { userId },
      {
        lotterySignups,
      },
      { returnDocument: "after" },
    ).lean();
    if (!response) {
      logger.error(new Error("Error saving lottery signups"));
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(`MongoDB: Signup data stored for user ${userId}`);

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveLotterySignups DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error storing signup data for user ${userId}`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface SaveLotterySignupParams {
  lotterySignup: LotterySignup;
  userId: string;
}

export const saveLotterySignup = async ({
  lotterySignup,
  userId,
}: SaveLotterySignupParams): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          lotterySignups: {
            programItemId: lotterySignup.programItemId,
            priority: lotterySignup.priority,
            signedToStartTime: lotterySignup.signedToStartTime,
          },
        },
      },
      { returnDocument: "after" },
    ).lean();
    if (!response) {
      logger.error(
        new Error(
          `Error saving lottery signup ${lotterySignup.programItemId} for user ${userId}, user not found`,
        ),
      );
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(
      `MongoDB: Lottery signup ${lotterySignup.programItemId} saved for user ${userId}`,
    );

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveLotterySignup DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error saving lottery signup ${lotterySignup.programItemId} for user ${userId}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export interface DeleteLotterySignupsParams {
  lotterySignupProgramItemIds: string[];
  userId: string;
}

export const delLotterySignups = async (
  usersToUpdate: DeleteLotterySignupsParams[],
): Promise<Result<void, MongoDbError>> => {
  try {
    const bulkOps = usersToUpdate.map(
      ({ userId, lotterySignupProgramItemIds }) => ({
        updateOne: {
          filter: { userId },
          update: {
            $pull: {
              lotterySignups: {
                programItemId: { $in: lotterySignupProgramItemIds },
              },
            },
          },
        },
      }),
    );

    await UserModel.bulkWrite(bulkOps);

    for (const userToUpdate of usersToUpdate) {
      logger.debug(
        `MongoDB: Deleted lottery signups ${userToUpdate.lotterySignupProgramItemIds.join(", ")} from users: ${userToUpdate.userId}`,
      );
    }

    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error deleting lottery signups from multiple users", {
        cause: error,
      }),
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
    logger.error(
      new Error("MongoDB: Error removing lottery signups", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
