import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import {
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
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
  logger.info("Generate settings data");

  await findSettings();

  const programItems = unsafelyUnwrap(await findProgramItems());
  const shuffledProgramItems = shuffleArray(programItems);

  const promises = testQuestions().map(async (testQuestion, index) => {
    const randomProgramItem = shuffledProgramItems[index];

    logger.info(
      `Add test question ${testQuestion} to program item ${randomProgramItem.title}`,
    );

    await saveSignupQuestion({
      programItemId: randomProgramItem.programItemId,
      questionFi: testQuestion,
      questionEn: testQuestion,
      private: Math.random() < 0.5,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
  });

  await Promise.all(promises);
};
