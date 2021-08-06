import faker from "faker";
import { logger } from "server/utils/logger";
import {
  findUsers,
  saveEnteredGame,
} from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { getRandomInt } from "server/features/player-assignment/utils/getRandomInt";

export const createEnteredGames = async (): Promise<void> => {
  logger.info(`Generate EnteredGames data`);

  const games = await findGames();

  const allUsers = await findUsers();
  const settings = await findSettings();

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "ropetiski"
  );

  logger.info(`EnteredGames: ${games.length} games`);
  logger.info(`EnteredGames: ${users.length} users`);

  const shuffledGames = shuffleArray(games);
  let currentIndex = 0;

  const promises = shuffledGames.flatMap((randomGame) => {
    if (currentIndex > users.length) {
      return;
    }

    const foundSignupMessage = settings.signupMessages.find(
      (signupMessage) => signupMessage.gameId === randomGame.gameId
    );

    const usersCount = getRandomInt(1, randomGame.maxAttendance);
    const usersChunk = users.slice(currentIndex, currentIndex + usersCount);

    currentIndex += usersCount;

    return usersChunk.map(async (user) => {
      await saveEnteredGame({
        username: user.username,
        enteredGameId: randomGame.gameId,
        startTime: randomGame.startTime,
        message: foundSignupMessage?.message ? faker.lorem.words(4) : "",
      });
    });
  });

  await Promise.all(promises);
};
