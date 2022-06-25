import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Result } from "shared/typings/models/result";
import { GameDoc } from "server/typings/game.typings";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { SelectedGame, User } from "shared/typings/models/user";
import { updateEnteredGames } from "server/features/user/entered-game/enteredGameRepository";

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly Result[]
): Promise<void> => {
  let users: User[];
  try {
    users = await findUsers();
  } catch (error) {
    throw new Error(`MongoDB: Error fetching users - ${error}`);
  }

  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    throw error;
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        const enteredGames = getCurrentEnteredGames(
          games,
          user,
          results,
          startingTime
        );
        await updateEnteredGames(enteredGames, user.username);
      })
    );
  } catch (error) {
    throw new Error(`Error saving signup results for users: ${error}`);
  }
};

const getCurrentEnteredGames = (
  games: GameDoc[],
  user: User,
  results: readonly Result[],
  startingTime: string
): SelectedGame[] => {
  const existingEnteredGames = user.enteredGames.filter(
    (enteredGame) =>
      dayjs(enteredGame.time).format() !== dayjs(startingTime).format()
  );

  const foundResult = results.find(
    (result) => result.username === user.username
  );

  const gameDocInDb = games.find(
    (game) => game.gameId === foundResult?.enteredGame.gameDetails.gameId
  );

  let enteredGames = existingEnteredGames;

  // Matching enteredGame exists -> override
  if (gameDocInDb && foundResult) {
    enteredGames = [
      ...existingEnteredGames,
      {
        gameDetails: gameDocInDb?._id,
        priority: foundResult?.enteredGame.priority,
        time: foundResult?.enteredGame.time,
        message: "",
      },
    ];
  }

  return enteredGames;
};
