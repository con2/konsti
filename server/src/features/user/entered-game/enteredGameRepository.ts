import { findGameById } from "server/features/game/gameRepository";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import {
  DeleteEnteredGameParameters,
  PostEnteredGameParameters,
} from "shared/typings/api/myGames";
import { SelectedGame, User } from "shared/typings/models/user";

export const updateEnteredGames = async (
  enteredGames: readonly SelectedGame[],
  username: string
): Promise<void> => {
  try {
    await UserModel.updateOne(
      {
        username,
      },
      {
        enteredGames,
      }
    );

    logger.debug(
      `MongoDB: Updated entered games stored for user "${username}"`
    );
  } catch (error) {
    logger.error(
      `MongoDB: Error updating entered games for user ${username} - ${error}`
    );
    throw error;
  }
};

export const saveEnteredGame = async (
  enteredGameRequest: PostEnteredGameParameters
): Promise<User> => {
  const { username, enteredGameId, startTime, message } = enteredGameRequest;

  let game;
  try {
    game = await findGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let user;
  try {
    user = await UserModel.findOneAndUpdate(
      { username },
      {
        $push: {
          enteredGames: {
            gameDetails: game._id,
            priority: 1,
            time: startTime,
            message,
          },
        },
      },
      { new: true, fields: "-enteredGames._id -_id -__v -createdAt -updatedAt" }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails", "-_id -__v -updatedAt")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(
      `MongoDB: Error saving entered game for user "${username}" - ${error}`
    );
    throw error;
  }

  if (!user) throw new Error(`Username ${username} not found`);

  logger.info(`MongoDB: Entered game saved for user "${username}"`);
  return user;
};

export const delEnteredGame = async (
  enteredGameRequest: DeleteEnteredGameParameters
): Promise<User> => {
  const { username, enteredGameId, startTime } = enteredGameRequest;

  let game;
  try {
    game = await findGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let user;
  try {
    user = await UserModel.findOneAndUpdate(
      { username },
      {
        $pull: {
          enteredGames: {
            gameDetails: game._id,
            time: startTime,
          },
        },
      },
      { new: true }
    )
      .lean<User>()
      .populate("favoritedGames")
      .populate("enteredGames.gameDetails")
      .populate("signedGames.gameDetails");
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting entered game from user "${username}" - ${error}`
    );
    throw error;
  }

  if (!user) throw new Error(`Username ${username} not found`);

  logger.info(`MongoDB: Entered game removed from user "${username}"`);
  return user;
};

export const removeEnteredGames = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await UserModel.updateMany({}, { enteredGames: [] });
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};
