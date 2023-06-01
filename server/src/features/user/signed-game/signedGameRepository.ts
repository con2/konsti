import { findGames } from "server/features/game/gameRepository";
import { UserModel } from "server/features/user/userSchema";
import { UserSignedGames } from "server/typings/result.typings";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { SelectedGame, User } from "shared/typings/models/user";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

export const saveSignedGames = async (
  signupData: UserSignedGames
): Promise<AsyncResult<User, MongoDbError>> => {
  const { signedGames, username } = signupData;

  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  const formattedData = signedGames.reduce<SelectedGame[]>(
    (acc, signedGame) => {
      const gameDocInDb = games.find(
        (game) => game.gameId === signedGame.gameDetails.gameId
      );

      if (gameDocInDb) {
        acc.push({
          gameDetails: gameDocInDb._id,
          priority: signedGame.priority,
          time: signedGame.time,
          message: signedGame.message,
        });
      }
      return acc;
    },
    []
  );

  try {
    const signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        signedGames: formattedData,
      },
      { new: true, fields: "-signedGames._id" }
    ).populate("signedGames.gameDetails");
    if (!signupResponse) {
      logger.error("Error saving signup");
      return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
    }
    logger.debug(`MongoDB: Signup data stored for user "${username}"`);
    return makeSuccessResult(signupResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup data for user "${username}" - ${error}`
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const removeSignedGames = async (): Promise<
  AsyncResult<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { signedGames: [] });
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`MongoDB: Error removing signups: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
