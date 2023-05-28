import { findGames } from "server/features/game/gameRepository";
import { UserModel } from "server/features/user/userSchema";
import { UserSignedGames } from "server/typings/result.typings";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { SelectedGame, User } from "shared/typings/models/user";
import {
  AsyncResult,
  isErrorResult,
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

  let signupResponse;
  try {
    signupResponse = await UserModel.findOneAndUpdate(
      { username },
      {
        signedGames: formattedData,
      },
      { new: true, fields: "-signedGames._id" }
    ).populate("signedGames.gameDetails");
    if (!signupResponse) {
      throw new Error("Error saving signup");
    }
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup data for user "${username}" - ${error}`
    );
    throw error;
  }

  logger.debug(`MongoDB: Signup data stored for user "${username}"`);
  return makeSuccessResult(signupResponse);
};

export const removeSignedGames = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { signedGames: [] });
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};
