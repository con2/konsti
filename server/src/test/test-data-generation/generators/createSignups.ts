import { faker } from "@faker-js/faker";
import { groupBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { getRandomInt } from "server/features/assignment/utils/getRandomInt";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";

export const createDirectSignups = async (): Promise<void> => {
  logger.info(`Generate direct signup data`);

  const programItemsResult = await findProgramItems();
  const programItems = unsafelyUnwrapResult(programItemsResult);

  const allUsersResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersResult);

  const findSettingsResult = await findSettings();
  const settings = unsafelyUnwrapResult(findSettingsResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  logger.info(`Signups: ${programItems.length} program items`);
  logger.info(`Signups: ${users.length} users`);

  const shuffledProgramItems = shuffleArray(programItems);

  const programItemsByProgramType = groupBy(
    shuffledProgramItems,
    "programType",
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
            startTime: randomProgramItem.startTime,
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
