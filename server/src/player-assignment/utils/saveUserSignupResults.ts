import moment from 'moment';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { Result } from 'typings/result.typings';
import { GameDoc } from 'typings/game.typings';
import { EnteredGame } from 'typings/user.typings';

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly Result[]
): Promise<void> => {
  let users;
  try {
    users = await db.user.findUsers();
  } catch (error) {
    throw new Error(`MongoDB: Error fetching users - ${error}`);
  }

  let games: GameDoc[];
  try {
    games = await db.game.findGames();
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

        await db.user.saveEnteredGames(enteredGames, user.username);
      })
    );
  } catch (error) {
    throw new Error(`Error saving signup results for users: ${error}`);
  }
};
