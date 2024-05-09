import { faker } from "@faker-js/faker";
import { groupBy } from "lodash-es";
import { logger } from "server/utils/logger";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { getRandomInt } from "server/features/player-assignment/utils/getRandomInt";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";

export const createDirectSignups = async (): Promise<void> => {
  logger.info(`Generate direct signup data`);

  const gamesResult = await findProgramItems();
  const games = unsafelyUnwrapResult(gamesResult);

  const allUsersResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersResult);

  const findSettingsResult = await findSettings();
  const settings = unsafelyUnwrapResult(findSettingsResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  logger.info(`Signups: ${games.length} games`);
  logger.info(`Signups: ${users.length} users`);

  const shuffledGames = shuffleArray(games);

  const gamesByProgramType = groupBy(shuffledGames, "programType");

  const promises = Object.entries(gamesByProgramType).flatMap(
    ([_programType, gamesForProgamType]) => {
      let currentIndex = 0;

      return gamesForProgamType.flatMap((randomGame) => {
        if (currentIndex > users.length) {
          return [];
        }

        const foundSignupQuestion = settings.signupQuestions.find(
          (signupQuestion) =>
            signupQuestion.programItemId === randomGame.programItemId,
        );

        const usersCount = getRandomInt(1, randomGame.maxAttendance);
        const usersChunk = users.slice(currentIndex, currentIndex + usersCount);

        currentIndex += usersCount;

        return usersChunk.map(async (user) => {
          await saveDirectSignup({
            username: user.username,
            directSignupProgramItemId: randomGame.programItemId,
            startTime: randomGame.startTime,
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
