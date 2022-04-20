import moment from "moment";
import { logger } from "server/utils/logger";
import { GameDoc } from "server/typings/game.typings";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";

export const removeMovedGamesFromUsers = async (
  updatedGames: readonly Game[]
): Promise<void> => {
  logger.info("Remove moved games from users");

  let currentGames: GameDoc[] = [];
  try {
    currentGames = await findGames();
  } catch (error) {
    logger.error(error);
  }

  const movedGames = currentGames.filter((currentGame) => {
    return updatedGames.find((updatedGame) => {
      return (
        currentGame.gameId === updatedGame.gameId &&
        moment(currentGame.startTime).format() !==
          moment(updatedGame.startTime).format()
      );
    });
  });

  if (!movedGames || movedGames.length === 0) return;

  logger.info(`Found ${movedGames.length} moved games`);

  let users;
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
    return await Promise.reject(error);
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        const signedGames = user.signedGames.filter((signedGame) => {
          const movedFound = movedGames.find((movedGame) => {
            return movedGame.gameId === signedGame.gameDetails.gameId;
          });
          if (!movedFound) {
            return signedGame;
          }
        });

        if (signedGames.length > 0) {
          logger.info(
            `Remove following moved signedGames from user ${
              user.username
            }: ${signedGames
              .map((signedGame) => signedGame.gameDetails.gameId)
              .join(", ")}`
          );
        }

        const enteredGames = user.enteredGames.filter((enteredGame) => {
          const movedFound = movedGames.find((movedGame) => {
            return movedGame.gameId === enteredGame.gameDetails.gameId;
          });
          if (!movedFound) {
            return enteredGame;
          }
        });

        if (enteredGames.length > 0) {
          logger.info(
            `Remove following moved enteredGames from user ${
              user.username
            }: ${enteredGames
              .map((enteredGame) => enteredGame.gameDetails.gameId)
              .join(", ")}`
          );
        }

        if (
          user.signedGames.length !== signedGames.length ||
          user.enteredGames.length !== enteredGames.length
        ) {
          await updateUserByUsername({
            ...user,
            signedGames,
            enteredGames,
          });
        }
      })
    );
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
    throw new Error("No assign results");
  }
};
