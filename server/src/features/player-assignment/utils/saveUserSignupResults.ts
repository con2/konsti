import moment from 'moment';
import { logger } from 'server/utils/logger';
import { Result } from 'server/typings/result.typings';
import { GameDoc } from 'server/typings/game.typings';
import { EnteredGame } from 'server/typings/user.typings';
import { findUsers, saveEnteredGames } from 'server/features/user/userService';
import { findGames } from 'server/features/game/gameService';

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly Result[]
): Promise<void> => {
  let users;
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
    return error;
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        const existingEnteredGames = user.enteredGames.filter(
          (enteredGame) =>
            moment(enteredGame.time).format() !== moment(startingTime).format()
        );

        const result = results.find(
          (result) => result.username === user.username
        );

        const gameDocInDb = games.find(
          (game) => game.gameId === result?.enteredGame.gameDetails.gameId
        );

        let enteredGames: EnteredGame[] = existingEnteredGames;

        if (gameDocInDb && result) {
          enteredGames = [
            ...existingEnteredGames,
            {
              gameDetails: gameDocInDb?._id,
              priority: result?.enteredGame.priority,
              time: result?.enteredGame.time,
            },
          ];
        }

        await saveEnteredGames(enteredGames, user.username);
      })
    );
  } catch (error) {
    throw new Error(`Error saving signup results for users: ${error}`);
  }
};
