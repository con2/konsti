import dayjs from "dayjs";
import { ObjectId } from "mongoose";
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
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeSignups = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSignups = async (): Promise<
  Result<Signup[], MongoDbError>
> => {
  try {
    const results = await SignupModel.find(
      {},
      "-createdAt -updatedAt -_id -__v -userSignups._id"
    )
      .lean<Signup[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");

    if (!results) {
      logger.info(`MongoDB: Signups not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Signups found`);

    const resultsWithFormattedTime = results
      .filter((result) => result.game) // Filter results with failed populate
      .map((result) => {
        return {
          ...result,
          userSignups: result.userSignups.map((userSignup) => {
            return {
              ...userSignup,
              time: dayjs(userSignup.time).toISOString(),
            };
          }),
        };
      });
    return makeSuccessResult(resultsWithFormattedTime);
  } catch (error) {
    logger.error("MongoDB: Error finding signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface FindRpgSignupsByStartTimeResponse extends UserSignup {
  gameId: string;
}

export const findRpgSignupsByStartTime = async (
  startTime: string
): Promise<Result<FindRpgSignupsByStartTimeResponse[], MongoDbError>> => {
  try {
    const response = await SignupModel.find(
      { "userSignups.time": startTime },
      "-createdAt -updatedAt -_id -__v"
    )
      .lean<Signup[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
    if (!response) {
      logger.info(`MongoDB: Signups for time ${startTime} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for time ${startTime}`);

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

    return makeSuccessResult(formattedResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for time ${startTime}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserSignups = async (
  username: string
): Promise<Result<Signup[], MongoDbError>> => {
  try {
    const response = await SignupModel.find(
      { "userSignups.username": username },
      "-createdAt -updatedAt -_id -__v"
    )
      .lean<Signup[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
    if (!response) {
      logger.info(`MongoDB: Signups for user ${username} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for user ${username}`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for user ${username}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSignup = async (
  signupsRequest: PostEnteredGameRequest
): Promise<Result<Signup, MongoDbError>> => {
  const { username, enteredGameId, startTime, message, priority } =
    signupsRequest;

  const gameResult = await findGameById(enteredGameId);
  if (isErrorResult(gameResult)) {
    return gameResult;
  }
  const game = unwrapResult(gameResult);

  try {
    const signup = await SignupModel.findOneAndUpdate(
      {
        game: game._id,
        count: { $lt: game.maxAttendance },
      },
      {
        $addToSet: {
          userSignups: {
            username,
            priority,
            time: startTime,
            message,
          },
        },
        $inc: { count: 1 },
      },
      {
        new: true,
        fields: "-userSignups._id -_id -__v -createdAt -updatedAt",
      }
    )
      .lean<Signup>()
      .populate("game");
    if (!signup) {
      logger.warn(
        `Saving signup for user ${username} failed: game ${game.gameId} not found or game full`
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    logger.info(`MongoDB: Signup saved for user ${username}`);
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error saving signup for user ${username}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delSignup = async (
  signupRequest: DeleteEnteredGameRequest
): Promise<Result<Signup, MongoDbError>> => {
  const { username, enteredGameId } = signupRequest;

  const gameResult = await findGameById(enteredGameId);
  if (isErrorResult(gameResult)) {
    return gameResult;
  }
  const game = unwrapResult(gameResult);

  try {
    const signup = await SignupModel.findOneAndUpdate(
      { game: game._id, "userSignups.username": username },
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

    if (!signup) {
      logger.error(
        "%s",
        new Error(
          `Signups for game ${game.gameId} for user ${username} not found`
        )
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const signupStillRemaining = signup.userSignups.some(
      (userSignup) => userSignup.username === username
    );

    if (signupStillRemaining) {
      logger.error(
        "%s",
        new Error(
          `Error removing signup for game ${game.gameId} from user ${username}`
        )
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info(`MongoDB: Signup removed from user ${username}`);
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting signup from user ${username}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delSignupDocumentsByGameIds = async (
  gameIds: string[]
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const gamesInDb = gameIds.map((gameId) =>
    games.find((game) => game.gameId === gameId)
  );

  const gameObjectIds = gamesInDb.flatMap((gameInDb) =>
    gameInDb?._id ? gameInDb?._id : []
  );

  try {
    await SignupModel.deleteMany({
      game: { $in: gameObjectIds },
    });
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signup documents for game IDs: %s",
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const resetSignupsByGameIds = async (
  gameIds: string[]
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const gamesInDb = gameIds.map((gameId) =>
    games.find((game) => game.gameId === gameId)
  );

  const gameObjectIds = gamesInDb.flatMap((gameInDb) =>
    gameInDb?._id ? gameInDb?._id : []
  );

  try {
    await SignupModel.updateMany(
      {
        game: { $in: gameObjectIds },
      },
      { userSignups: [], count: 0 }
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing signups for game IDs: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delRpgSignupsByStartTime = async (
  startTime: string
): Promise<Result<number, MongoDbError>> => {
  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  // Only remove TABLETOP_RPG signups and don't remove directSignupAlwaysOpen signups
  const doNotRemoveGameIds = games
    .filter(
      (game) =>
        sharedConfig.directSignupAlwaysOpenIds.includes(game.gameId) ||
        game.programType !== ProgramType.TABLETOP_RPG
    )
    .map((game) => game._id);

  try {
    const response = await SignupModel.updateMany(
      { "userSignups.time": startTime, game: { $nin: doNotRemoveGameIds } },
      { userSignups: [], count: 0 }
    );
    logger.info(
      `MongoDB: Deleted signups for ${response.modifiedCount} games for startTime: ${startTime}`
    );
    return makeSuccessResult(response.modifiedCount);
  } catch (error) {
    logger.error("MongoDB: Error removing invalid signup: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createEmptySignupDocumentForProgramItems = async (
  programItemObjectIds: ObjectId[]
): Promise<Result<void, MongoDbError>> => {
  const signupDocs = programItemObjectIds.map((programItemObjectId) => {
    return new SignupModel({
      game: programItemObjectId,
      userSignups: [],
      count: 0,
    });
  });

  try {
    await SignupModel.create(signupDocs);
    logger.info(
      `MongoDB: Signup collection created for ${programItemObjectIds.length} program items `
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Creating signup collection for ${programItemObjectIds.length} program items failed: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
