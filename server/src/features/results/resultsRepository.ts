import { logger } from "server/utils/logger";
import { ResultsModel } from "server/features/results/resultsSchema";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { findGames } from "server/features/game/gameRepository";
import { AssignmentResult } from "shared/types/models/result";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const removeResults = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL results from db");
  try {
    await ResultsModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing ALL results: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findResult = async (
  startTime: string,
): Promise<Result<ResultsCollectionEntry | null, MongoDbError>> => {
  try {
    const response = await ResultsModel.findOne(
      { startTime },
      "-_id -__v -createdAt -updatedAt -result._id",
    )
      .lean<ResultsCollectionEntry>()
      .sort({ createdAt: -1 })
      .populate("results.enteredGame.gameDetails");
    logger.debug(`MongoDB: Results data found for time ${startTime}`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding results data for time ${startTime}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveResult = async (
  signupResultData: readonly AssignmentResult[],
  startTime: string,
  algorithm: string,
  message: string,
): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findGames();

  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }

  const games = unwrapResult(gamesResult);
  const results = signupResultData.reduce<AssignmentResult[]>((acc, result) => {
    const gameDocInDb = games.find(
      (game) => game.gameId === result.enteredGame.gameDetails.gameId,
    );

    if (gameDocInDb) {
      acc.push({
        username: result.username,
        enteredGame: {
          gameDetails: gameDocInDb._id,
          priority: result.enteredGame.priority,
          time: result.enteredGame.time,
          message: "",
        },
      });
    }
    return acc;
  }, []);

  try {
    await ResultsModel.replaceOne(
      { startTime },
      { startTime, results, algorithm, message },
      { upsert: true },
    );
    logger.debug(
      `MongoDB: Signup results for start time ${startTime} stored to separate collection`,
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results for start time ${startTime} to separate collection: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
