import { faker } from "@faker-js/faker";
import { groupBy } from "remeda";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { getRandomInt } from "server/features/assignment/utils/getRandomInt";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { shuffleArray } from "server/utils/shuffleArray";

export const createDirectSignups = async (): Promise<void> => {
  logger.info("Generate direct signup data");

  const programItems = unsafelyUnwrap(await findProgramItems());
  const allUsers = unsafelyUnwrap(await findUsers());
  const settings = unsafelyUnwrap(await findOrCreateSettings());

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  // A lottery program item takes first-come sign-ups only once its lottery is behind it, so
  // these are the leftovers after the simulated lottery - not a queue competing with it
  const signupTargets = programItems.filter(
    (programItem) =>
      !isLotterySignupProgramItem(programItem) ||
      programItem.lotteryRanForStartTime !== undefined,
  );

  logger.info(`Signups: ${signupTargets.length} program items`);
  logger.info(`Signups: ${users.length} users`);

  const shuffledProgramItems = shuffleArray(signupTargets);

  const programItemsByProgramType = groupBy(
    shuffledProgramItems,
    (programItem) => programItem.programType,
  );

  const promises = Object.entries(programItemsByProgramType).flatMap(
    ([_programType, programItemsForProgamType]) => {
      let currentIndex = 0;

      return programItemsForProgamType.flatMap((randomProgramItem) => {
        if (currentIndex > users.length) {
          return [];
        }

        const foundSignupQuestion = settings.signupQuestions.find(
          (signupQuestion) =>
            signupQuestion.programItemId === randomProgramItem.programItemId,
        );

        const usersCount = getRandomInt(1, randomProgramItem.maxAttendance);
        const usersChunk = users.slice(currentIndex, currentIndex + usersCount);

        currentIndex += usersCount;

        return usersChunk.map(async (user) => {
          await saveDirectSignup({
            username: user.username,
            directSignupProgramItemId: randomProgramItem.programItemId,
            signedToStartTime: randomProgramItem.startTime,
            signupTime: randomProgramItem.startTime,
            message: foundSignupQuestion?.questionFi
              ? faker.lorem.words(4)
              : "",
            priority: DIRECT_SIGNUP_PRIORITY,
          });
        });
      });
    },
  );

  await Promise.all(promises);

  logger.info(`Generated ${promises.length} signups`);
};
