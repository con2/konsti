import { logger } from "server/utils/logger";
import { findGames } from "server/features/game/gameRepository";
import {
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";

interface CreateSettingsParameters {
  signupQuestions: boolean;
}

const testQuestions = [
  "Character class and level",
  "Do you like cake?",
  "Have you played this before?",
  "Can you make it in time?",
  "Do you know the place?",
];

export const createSettings = async ({
  signupQuestions,
}: CreateSettingsParameters): Promise<void> => {
  logger.info(`Generate settings data`);

  await findSettings();

  if (signupQuestions) {
    const games = await findGames();

    const promises = testQuestions.map(async (testQuestion) => {
      const randomGame = games[Math.floor(Math.random() * games.length)];

      logger.info(
        `Add test question "${testQuestion}" to game "${randomGame.title}"`
      );

      await saveSignupQuestion({
        gameId: randomGame.gameId,
        message: testQuestion,
        private: false,
      });
    });

    await Promise.all(promises);
  }
};
