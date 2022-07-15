import { findGameById } from "server/features/game/gameRepository";
import { Signup } from "server/features/signup/signup.typings";
import { SignupModel } from "server/features/signup/signupSchema";
import { logger } from "server/utils/logger";
import {
  DeleteEnteredGameParameters,
  PostEnteredGameParameters,
} from "shared/typings/api/myGames";

export const removeSignups = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await SignupModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing signups: ${error}`);
  }
};

export const findSignups = async (): Promise<Signup[]> => {
  let response: Signup[];
  try {
    response = await SignupModel.find({}, "-createdAt -updatedAt -_id -__v")
      .lean<Signup>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
  } catch (error) {
    logger.error(`MongoDB: Error finding signups: ${error}`);
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: Signups not found`);
    return [];
  }

  logger.debug(`MongoDB: Signups found`);
  return response;
};

export const findUserSignups = async (username: string): Promise<Signup[]> => {
  let response: Signup[];
  try {
    response = await SignupModel.find(
      { "userSignups.username": username },
      "-createdAt -updatedAt -_id -__v"
    )
      .lean<Signup>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for user ${username} - ${error}`
    );
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: Signups for user "${username}" not found`);
    return [];
  }

  logger.debug(`MongoDB: Found signups for user "${username}"`);
  return response;
};

export const saveSignup = async (
  signupsRequest: PostEnteredGameParameters
): Promise<Signup> => {
  const { username, enteredGameId, startTime, message } = signupsRequest;

  let game;
  try {
    game = await findGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let signup;
  try {
    signup = await SignupModel.findOneAndUpdate(
      {
        game: game._id,
        count: { $lt: game.maxAttendance },
      },
      {
        $addToSet: {
          userSignups: {
            username,
            priority: 1,
            time: startTime,
            message,
          },
        },
        $inc: { count: 1 },
      },
      {
        new: true,
        upsert: true,
        fields: "-userSignups._id -_id -__v -createdAt -updatedAt",
      }
    )
      .lean<Signup>()
      .populate("game");
  } catch (error) {
    logger.error(
      `MongoDB: Error saving signup for user "${username}" - ${error}`
    );
    throw error;
  }

  if (!signup)
    throw new Error(
      `Signup for user ${username} and game ${game.gameId} not found`
    );

  logger.info(`MongoDB: Signup saved for user "${username}"`);
  return signup;
};

export const delSignup = async (
  signupRequest: DeleteEnteredGameParameters
): Promise<Signup> => {
  const { username, enteredGameId, startTime } = signupRequest;

  let game;
  try {
    game = await findGameById(enteredGameId);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  let signup;
  try {
    signup = await SignupModel.findOneAndUpdate(
      { game: game._id },
      {
        $pull: {
          userSignups: {
            username,
            time: startTime,
          },
        },
        $inc: { count: -1 },
      },
      { new: true, fields: "-userSignups._id -_id -__v -createdAt -updatedAt" }
    )
      .lean<Signup>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting signup from user "${username}" - ${error}`
    );
    throw error;
  }

  if (!signup) throw new Error(`Signup for user ${username} not found`);

  logger.info(`MongoDB: Signup removed from user "${username}"`);
  return signup;
};

interface DelSignupsByGameIdResponse {
  gameId: string;
  deletedCount: number;
}

export const delSignupsByGameIds = async (
  gameIds: string[]
): Promise<DelSignupsByGameIdResponse[]> => {
  const promises = gameIds.flatMap(async (gameId) => {
    let game;
    try {
      game = await findGameById(gameId);
    } catch (error) {
      logger.error(error);
      throw error;
    }

    let response;
    try {
      response = await SignupModel.deleteOne({ game: game._id });
    } catch (error) {
      logger.error(`MongoDB: Error removing invalid signup - ${error}`);
      throw error;
    }

    return {
      gameId: game.gameId,
      deletedCount: response.deletedCount,
    };
  });

  const responses = await Promise.all(promises);

  logger.info(`MongoDB: Deleted signups for games: ${gameIds.join(", ")}`);
  return responses;
};

export const delSignupsByStartTime = async (
  startTime: string
): Promise<number> => {
  let response;
  try {
    response = await SignupModel.deleteMany({ "userSignups.time": startTime });
  } catch (error) {
    logger.error(`MongoDB: Error removing invalid signup - ${error}`);
    throw error;
  }

  logger.info(
    `MongoDB: Deleted ${response.deletedCount} signups for startTime: ${startTime}`
  );

  return response.deletedCount;
};
