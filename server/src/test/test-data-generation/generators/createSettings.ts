import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { findGames } from "server/features/game/gameRepository";
import {
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

const NUMBER_OF_TEST_QUESTIONS = 20;

const testQuestions = (): string[] => {
  const questions = [];
  for (let i = 0; i < NUMBER_OF_TEST_QUESTIONS; i++) {
    questions.push(faker.lorem.sentence());
  }
  return questions;
};

export const createSettings = async (): Promise<void> => {
  logger.info(`Generate settings data`);

  await findSettings();

  const gamesResult = await findGames();
  const games = unsafelyUnwrapResult(gamesResult);
  const shuffledGames = shuffleArray(games);

  const promises = testQuestions().map(async (testQuestion, index) => {
    const randomGame = shuffledGames[index];

    logger.info(
      `Add test question ${testQuestion} to game ${randomGame.title}`
    );

    await saveSignupQuestion({
      gameId: randomGame.gameId,
      message: testQuestion,
      private: Math.random() < 0.5,
    });
  });

  await Promise.all(promises);
};
