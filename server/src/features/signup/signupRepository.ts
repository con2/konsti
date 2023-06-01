import { findGameById, findGames } from "server/features/game/gameRepository";
import { Signup, UserSignup } from "server/features/signup/signup.typings";
import { SignupModel } from "server/features/signup/signupSchema";
import { logger } from "server/utils/logger";
import { sharedConfig } from "shared/config/sharedConfig";
import { MongoDbError } from "shared/typings/api/errors";
import {
  DeleteEnteredGameRequest,
  PostEnteredGameRequest,
} from "shared/typings/api/myGames";
import { ProgramType } from "shared/typings/models/game";
import {
  AsyncResult,
  isErrorResult,
  isSuccessResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

export const removeSignups = async (): Promise<
  AsyncResult<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`MongoDB: Error removing signups: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSignups = async (): Promise<
  AsyncResult<Signup[], MongoDbError>
> => {
  try {
    const response = await SignupModel.find(
      {},
      "-createdAt -updatedAt -_id -__v"
    )
      .lean<Signup[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");

    if (!response) {
      logger.info(`MongoDB: Signups not found`);
      return makeSuccessResult([]);
    }
    logger.debug(`MongoDB: Signups found`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding signups: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export interface FindRpgSignupsByStartTimeResponse extends UserSignup {
  gameId: string;
}

export const findRpgSignupsByStartTime = async (
  startTime: string
): Promise<FindRpgSignupsByStartTimeResponse[]> => {
  let response: Signup[];
  try {
    response = await SignupModel.find(
      { "userSignups.time": startTime },
      "-createdAt -updatedAt -_id -__v"
    )
      .lean<Signup>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for time ${startTime} - ${error}`
    );
    throw error;
  }

  if (!response) {
    logger.info(`MongoDB: Signups for time "${startTime}" not found`);
    return [];
  }

  logger.debug(`MongoDB: Found signups for time "${startTime}"`);

  const formattedResponse: FindRpgSignupsByStartTimeResponse[] =
    response.flatMap((signup) => {
      if (signup.game.programType !== ProgramType.TABLETOP_RPG) {
        return [];
      }
      return signup.userSignups.map((userSignup) => ({
        ...userSignup,
        gameId: signup.game.gameId,
      }));
    });

  return formattedResponse;
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
  signupsRequest: PostEnteredGameRequest
): Promise<AsyncResult<Signup, MongoDbError>> => {
  const { username, enteredGameId, startTime, message } = signupsRequest;

  const gameAsyncResult = await findGameById(enteredGameId);
  if (isErrorResult(gameAsyncResult)) {
    return gameAsyncResult;
  }

  const game = unwrapResult(gameAsyncResult);

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
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (!signup) {
    logger.error(
      `Signup for user ${username} and game ${game.gameId} not found`
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info(`MongoDB: Signup saved for user "${username}"`);
  return makeSuccessResult(signup);
};

export const delSignup = async (
  signupRequest: DeleteEnteredGameRequest
): Promise<AsyncResult<Signup, MongoDbError>> => {
  const { username, enteredGameId } = signupRequest;

  const gameAsyncResult = await findGameById(enteredGameId);
  if (isErrorResult(gameAsyncResult)) {
    return gameAsyncResult;
  }

  const game = unwrapResult(gameAsyncResult);

  let signup;
  try {
    signup = await SignupModel.findOneAndUpdate(
      { game: game._id },
      {
        $pull: {
          userSignups: {
            username,
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
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (!signup) {
    logger.error(`Signups for game ${game.gameId} not found`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const signupStillRemaining = signup.userSignups.some(
    (userSignup) => userSignup.username === username
  );

  if (signupStillRemaining) {
    logger.error(
      `Error removing signup for game ${game.gameId} from user ${username}`
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info(`MongoDB: Signup removed from user "${username}"`);
  return makeSuccessResult(signup);
};

interface DelSignupsByGameIdResponse {
  gameId: string;
  deletedCount: number;
}

export const delSignupsByGameIds = async (
  gameIds: string[]
): Promise<AsyncResult<DelSignupsByGameIdResponse[], MongoDbError>> => {
  const promises = gameIds.map(async (gameId) => {
    const gameAsyncResult = await findGameById(gameId);
    if (isErrorResult(gameAsyncResult)) {
      return gameAsyncResult;
    }

    const game = unwrapResult(gameAsyncResult);

    let response;
    try {
      response = await SignupModel.deleteOne({ game: game._id });
    } catch (error) {
      logger.error(`MongoDB: Error removing invalid signup - ${error}`);
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult({
      gameId: game.gameId,
      deletedCount: response.deletedCount,
    });
  });

  const responseAsyncResults = await Promise.all(promises);

  const someRequestFailed = responseAsyncResults.some((result) =>
    isErrorResult(result)
  );

  if (someRequestFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info(`MongoDB: Deleted signups for games: ${gameIds.join(", ")}`);

  const results = responseAsyncResults.flatMap((result) => {
    if (isSuccessResult(result)) {
      return unwrapResult(result);
    }
    return [];
  });

  return makeSuccessResult(results);
};

export const delRpgSignupsByStartTime = async (
  startTime: string
): Promise<AsyncResult<number, MongoDbError>> => {
  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  // Only remove TABLETOP_RPG signups and don't remove directSignupAlwaysOpen signups
  const doNotRemoveGameIds = games
    .filter(
      (game) =>
        sharedConfig.directSignupAlwaysOpenIds.includes(game.gameId) ||
        game.programType !== ProgramType.TABLETOP_RPG
    )
    .map((game) => game._id);

  let response;
  try {
    response = await SignupModel.deleteMany({
      "userSignups.time": startTime,
      game: { $nin: doNotRemoveGameIds },
    });
  } catch (error) {
    logger.error(`MongoDB: Error removing invalid signup - ${error}`);
    throw error;
  }

  logger.info(
    `MongoDB: Deleted ${response.deletedCount} signups for startTime: ${startTime}`
  );

  return makeSuccessResult(response.deletedCount);
};
