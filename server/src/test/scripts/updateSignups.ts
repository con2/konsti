import { db } from "server/db/mongodb";
import { findGames } from "server/features/game/gameRepository";
import { SignupModel } from "server/features/signup/signupSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

const createSignups = async (): Promise<Result<void, MongoDbError>> => {
  const gamesResult = await findGames();

  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }

  const games = unwrapResult(gamesResult);

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
      makeSuccessResult(undefined);
    } catch (error) {
      logger.error("MongoDB: Error creating signups: %s", error);
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
  });

  await Promise.all(promises);

  return makeSuccessResult(undefined);
};

const init = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    logger.error("%s", new Error("Signup update not allowed in production"));
    return;
  }

  await db.connectToDb();
  await createSignups();
  await db.gracefulExit();
};

init().catch((error) => {
  logger.error(error);
});
