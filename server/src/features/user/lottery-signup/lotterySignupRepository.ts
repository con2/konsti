import { findProgramItems } from "server/features/program-item/programItemRepository";
import { UserModel } from "server/features/user/userSchema";
import { UserLotterySignups } from "server/types/resultTypes";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { Signup, User } from "shared/types/models/user";
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

  const gamesResult = await findProgramItems();

  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }

  const games = unwrapResult(gamesResult);

  const formattedData = lotterySignups.reduce<Signup[]>(
    (acc, lotterySignup) => {
      const gameDocInDb = games.find(
        (game) => game.gameId === lotterySignup.programItemDetails.gameId,
      );

      if (gameDocInDb) {
        acc.push({
          programItemDetails: gameDocInDb._id,
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
    ).populate("lotterySignups.programItemDetails");
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
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing lottery signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
