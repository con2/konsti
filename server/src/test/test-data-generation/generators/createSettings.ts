import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import {
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { SignupQuestionType } from "shared/types/models/settings";

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

  const programItemsResult = await findProgramItems();
  const programItems = unsafelyUnwrapResult(programItemsResult);
  const shuffledGames = shuffleArray(programItems);

  const promises = testQuestions().map(async (testQuestion, index) => {
    const randomGame = shuffledGames[index];

    logger.info(
      `Add test question ${testQuestion} to game ${randomGame.title}`,
    );

    await saveSignupQuestion({
      programItemId: randomGame.programItemId,
      questionFi: testQuestion,
      questionEn: testQuestion,
      private: Math.random() < 0.5,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
  });

  await Promise.all(promises);
};
