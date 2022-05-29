import { findGames } from "server/features/game/gameRepository";
import { UserModel } from "server/features/user/userSchema";
import { GameDoc } from "server/typings/game.typings";
import { UserSignedGames } from "server/typings/result.typings";
import { logger } from "server/utils/logger";
import { SelectedGame, User } from "shared/typings/models/user";

export const saveSignedGames = async (
  signupData: UserSignedGames
): Promise<User> => {
  const { signedGames, username } = signupData;

  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    throw error;
  }

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
      { username: username },
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
  return signupResponse;
};

export const removeSignedGames = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { signedGames: [] });
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};
