import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
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
    const response = await UserModel.findOneAndUpdate(
      { username },
      {
        lotterySignups,
      },
      { new: true },
    ).lean();
    if (!response) {
      logger.error("%s", new Error("Error saving lottery signups"));
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(`MongoDB: Signup data stored for user ${username}`);

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveLotterySignups DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
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
    const response = await UserModel.findOneAndUpdate(
      { username },
      {
        $addToSet: {
          lotterySignups: {
            programItemId: lotterySignup.programItemId,
            priority: lotterySignup.priority,
            signedToStartTime: lotterySignup.signedToStartTime,
          },
        },
      },
      { new: true },
    ).lean();
    if (!response) {
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

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveLotterySignup DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      `MongoDB: Error saving lottery signup ${lotterySignup.programItemId} for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export interface DeleteLotterySignupsParams {
  lotterySignupProgramItemIds: string[];
  username: string;
}

export const delLotterySignups = async (
  usersToUpdate: DeleteLotterySignupsParams[],
): Promise<Result<void, MongoDbError>> => {
  try {
    const bulkOps = usersToUpdate.map(
      ({ username, lotterySignupProgramItemIds }) => ({
        updateOne: {
          filter: { username },
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

    usersToUpdate.map((e) => {
      logger.debug(
        `MongoDB: Deleted lottery signups ${e.lotterySignupProgramItemIds.join(", ")} from users: ${e.username}`,
      );
    });

    return makeSuccessResult();
  } catch (error) {
    logger.error(
      "MongoDB: Error deleting lottery signups from multiple users: %s",
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
