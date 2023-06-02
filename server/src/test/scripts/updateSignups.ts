import { db } from "server/db/mongodb";
import { findGames } from "server/features/game/gameRepository";
import { SignupModel } from "server/features/signup/signupSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

const createSignups = async (): Promise<AsyncResult<void, MongoDbError>> => {
  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  const promises = games.map(async (game) => {
    try {
      await SignupModel.findOneAndUpdate(
        {
          game: game._id,
        },
        {
          $setOnInsert: {
            userSignups: [],
            count: 0,
          },
        },
        {
          new: true,
          upsert: true,
          fields: "-userSignups._id -_id -__v -createdAt -updatedAt",
        }
      );
    } catch (error) {
      logger.error(`MongoDB: ${error}`);
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
  });

  await Promise.all(promises);

  return makeSuccessResult(undefined);
};

const init = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    logger.error(`Signup update not allowed in production`);
    return;
  }

  await db.connectToDb();
  await createSignups();
  await db.gracefulExit();
};

init().catch((error) => {
  logger.error(error);
});
