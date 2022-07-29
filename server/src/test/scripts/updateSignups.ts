import { db } from "server/db/mongodb";
import { findGames } from "server/features/game/gameRepository";
import { SignupModel } from "server/features/signup/signupSchema";
import { logger } from "server/utils/logger";

const createSignups = async (): Promise<void> => {
  let games;
  try {
    games = await findGames();
  } catch (error) {
    logger.error(error);
    throw error;
  }

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
      throw error;
    }
  });

  await Promise.all(promises);
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
