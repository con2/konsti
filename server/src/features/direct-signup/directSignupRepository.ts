import dayjs from "dayjs";
import { groupBy, shuffle } from "lodash-es";
import { ObjectId } from "mongoose";
import {
  findProgramItemById,
  findProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  DirectSignupsForProgramItem,
  UserDirectSignup,
} from "server/features/direct-signup/directSignupTypes";
import { SignupModel } from "server/features/direct-signup/directSignupSchema";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupRequest,
} from "shared/types/api/myGames";
import { ProgramType } from "shared/types/models/programItem";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeDirectSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL direct signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findDirectSignups = async (): Promise<
  Result<DirectSignupsForProgramItem[], MongoDbError>
> => {
  try {
    const results = await SignupModel.find(
      {},
      "-createdAt -updatedAt -_id -__v -userSignups._id",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!results) {
      logger.info(`MongoDB: Direct signups not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Direct signups found`);

    const resultsWithFormattedTime = results
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
    logger.error("MongoDB: Error finding direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface FindDirectSignupsByProgramTypesResponse extends UserDirectSignup {
  gameId: string;
}

export const findDirectSignupsByProgramTypes = async (
  programTypes: ProgramType[],
  startTime: string,
): Promise<Result<FindDirectSignupsByProgramTypesResponse[], MongoDbError>> => {
  const gamesResult = await findProgramItems();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const gamesByProgramTypesForStartTimeObjectIds = games
    .filter((game) => dayjs(game.startTime).isSame(dayjs(startTime)))
    .filter((game) => programTypes.includes(game.programType))
    .map((game) => game._id);

  try {
    const signups = await SignupModel.find(
      { game: { $in: gamesByProgramTypesForStartTimeObjectIds } },
      "-createdAt -updatedAt -_id -__v",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!signups) {
      logger.info(`MongoDB: Signups for time ${startTime} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for time ${startTime}`);

    const formattedResponse: FindDirectSignupsByProgramTypesResponse[] =
      signups.flatMap((signup) => {
        return signup.userSignups.map((userSignup) => ({
          ...userSignup,
          gameId: signup.game.gameId,
        }));
      });

    return makeSuccessResult(formattedResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for time ${startTime}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserDirectSignups = async (
  username: string,
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  try {
    const response = await SignupModel.find(
      { "userSignups.username": username },
      "-createdAt -updatedAt -_id -__v",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("game", "-createdAt -updatedAt -_id -__v");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response) {
      logger.info(`MongoDB: Signups for user ${username} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for user ${username}`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveDirectSignup = async (
  signupsRequest: PostDirectSignupRequest,
): Promise<Result<DirectSignupsForProgramItem, MongoDbError>> => {
  const { username, directSignupGameId, startTime, message, priority } =
    signupsRequest;

  const gameResult = await findProgramItemById(directSignupGameId);
  if (isErrorResult(gameResult)) {
    return gameResult;
  }
  const game = unwrapResult(gameResult);

  try {
    const signup = await SignupModel.findOneAndUpdate(
      {
        game: game._id,
        count: { $lt: game.maxAttendance },
        "userSignups.username": { $ne: username },
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
      },
    )
      .lean<DirectSignupsForProgramItem>()
      .populate("game");
    if (!signup) {
      logger.warn(
        `Saving signup for user ${username} failed: game ${game.gameId} not found or game full`,
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    logger.info(`MongoDB: Signup saved for user ${username}`);
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error saving signup for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface SaveSignupsResponse {
  modifiedCount: number;
  droppedSignups: PostDirectSignupRequest[];
}

export const saveDirectSignups = async (
  signupsRequests: PostDirectSignupRequest[],
): Promise<Result<SaveSignupsResponse, MongoDbError>> => {
  const gamesResult = await findProgramItems();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const signupsByProgramItems = groupBy(
    signupsRequests,
    (signupsRequest) => signupsRequest.directSignupGameId,
  );

  const droppedSignups: PostDirectSignupRequest[] = [];

  const bulkOps = Object.entries(signupsByProgramItems).flatMap(
    ([gameId, directSignups]) => {
      const game = games.find((g) => g.gameId === gameId);
      if (!game) {
        return [];
      }

      let finalSignups: PostDirectSignupRequest[] = directSignups;
      if (directSignups.length > game.maxAttendance) {
        logger.error(
          "%s",
          new Error(
            `Too many signups passed to saveSignups for program item ${game.gameId} - maxAttendance: ${game.maxAttendance}, direct signups: ${directSignups.length}`,
          ),
        );
        const shuffledSignups = shuffle(directSignups);
        finalSignups = shuffledSignups.slice(0, game.maxAttendance);
        droppedSignups.push(
          ...shuffledSignups.slice(game.maxAttendance, shuffledSignups.length),
        );
      }

      return {
        updateOne: {
          filter: {
            game: game._id,
          },
          update: {
            $addToSet: {
              userSignups: finalSignups.map((signup) => ({
                username: signup.username,
                priority: signup.priority,
                time: signup.startTime,
                message: signup.message,
              })),
            },
            count: finalSignups.length,
          },
        },
      };
    },
  );

  try {
    const response = await SignupModel.bulkWrite(bulkOps);
    logger.info(`Updated signups for ${response.modifiedCount} program items`);
    return makeSuccessResult({
      modifiedCount: response.modifiedCount,
      droppedSignups,
    });
  } catch (error) {
    logger.error(`MongoDB: Error saving direct signups: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delDirectSignup = async (
  signupRequest: DeleteDirectSignupRequest,
): Promise<Result<DirectSignupsForProgramItem, MongoDbError>> => {
  const { username, directSignupGameId } = signupRequest;

  const gameResult = await findProgramItemById(directSignupGameId);
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
      { new: true, fields: "-userSignups._id -_id -__v -createdAt -updatedAt" },
    )
      .lean<DirectSignupsForProgramItem>()
      .populate("game", "-createdAt -updatedAt -_id -__v");

    if (!signup) {
      logger.error(
        "%s",
        new Error(
          `Signups to program item ${game.gameId} for user ${username} not found`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const signupStillRemaining = signup.userSignups.some(
      (userSignup) => userSignup.username === username,
    );

    if (signupStillRemaining) {
      logger.error(
        "%s",
        new Error(
          `Error removing signup to program item ${game.gameId} from user ${username}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info(
      `MongoDB: Signup removed - program item: ${
        game.gameId
      }, user: ${username}, starting: ${dayjs(game.startTime).toISOString()}`,
    );
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting signup to program item ${game.gameId} from user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delDirectSignupDocumentsByGameIds = async (
  gameIds: string[],
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findProgramItems();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const gamesInDb = gameIds.map((gameId) =>
    games.find((game) => game.gameId === gameId),
  );

  const gameObjectIds = gamesInDb.flatMap((gameInDb) =>
    gameInDb?._id ? gameInDb._id : [],
  );

  try {
    await SignupModel.deleteMany({
      game: { $in: gameObjectIds },
    });
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signup documents for game IDs: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const resetDirectSignupsByGameIds = async (
  gameIds: string[],
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findProgramItems();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  const gamesInDb = gameIds.map((gameId) =>
    games.find((game) => game.gameId === gameId),
  );

  const gameObjectIds = gamesInDb.flatMap((gameInDb) =>
    gameInDb?._id ? gameInDb._id : [],
  );

  try {
    await SignupModel.updateMany(
      {
        game: { $in: gameObjectIds },
      },
      { userSignups: [], count: 0 },
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing signups for game IDs: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delAssignmentDirectSignupsByStartTime = async (
  startTime: string,
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findProgramItems();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }
  const games = unwrapResult(gamesResult);

  // Only remove "twoPhaseSignupProgramTypes" signups and don't remove "directSignupAlwaysOpen" signups
  const doNotRemoveGameObjectIds = games
    .filter(
      (game) =>
        config.shared().directSignupAlwaysOpenIds.includes(game.gameId) ||
        !config.shared().twoPhaseSignupProgramTypes.includes(game.programType),
    )
    .map((game) => game._id);

  try {
    await SignupModel.updateMany(
      {
        game: { $nin: doNotRemoveGameObjectIds },
      },
      [
        {
          $set: {
            userSignups: {
              $filter: {
                input: "$userSignups",
                as: "userSignup",
                cond: {
                  $ne: ["$$userSignup.time", new Date(startTime)],
                },
              },
            },
          },
        },
        {
          $set: { count: { $size: "$userSignups" } },
        },
      ],
    );
    logger.info(`MongoDB: Deleted old signups for startTime: ${startTime}`);
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing invalid signup: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createEmptyDirectSignupDocumentForProgramItems = async (
  programItemObjectIds: ObjectId[],
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
      `MongoDB: Signup collection created for ${programItemObjectIds.length} program items `,
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Creating signup collection for ${programItemObjectIds.length} program items failed: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
