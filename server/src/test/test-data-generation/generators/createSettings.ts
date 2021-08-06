import { logger } from "server/utils/logger";
import { findGames } from "server/features/game/gameRepository";
import {
  findSettings,
  saveSignupMessage,
} from "server/features/settings/settingsRepository";

interface CreateSettingsParameters {
  signupMessages: boolean;
}

const testMessages = [
  "Character class and level",
  "Do you like cake?",
  "Have you played this before?",
  "Can you make it in time?",
  "Do you know the place?",
];

export const createSettings = async ({
  signupMessages,
}: CreateSettingsParameters): Promise<void> => {
  logger.info(`Generate settings data`);

  await findSettings();

  if (signupMessages) {
    const games = await findGames();

    const promises = testMessages.map(async (testMessage, index) => {
      const randomGame = games[Math.floor(Math.random() * games.length)];

      logger.info(
        `Add test message "${testMessages[index]}" to game "${randomGame.title}"`
      );

      await saveSignupMessage({
        gameId: randomGame.gameId,
        message: testMessages[index],
      });
    });

    await Promise.all(promises);
  }
};
