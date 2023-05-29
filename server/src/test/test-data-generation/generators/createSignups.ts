import { faker } from "@faker-js/faker";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { getRandomInt } from "server/features/player-assignment/utils/getRandomInt";
import { saveSignup } from "server/features/signup/signupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

export const createSignups = async (): Promise<void> => {
  logger.info(`Generate signup data`);

  const gamesAsyncResult = await findGames();
  const games = unsafelyUnwrapResult(gamesAsyncResult);

  const allUsersAsyncResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersAsyncResult);

  const settings = await findSettings();

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper"
  );

  logger.info(`Signups: ${games.length} games`);
  logger.info(`Signups: ${users.length} users`);

  const shuffledGames = shuffleArray(games);

  const gamesByProgramType = _.groupBy(shuffledGames, "programType");

  const promises = Object.entries(gamesByProgramType).flatMap(
    ([_programType, gamesForProgamType]) => {
      let currentIndex = 0;

      return gamesForProgamType.flatMap((randomGame) => {
        if (currentIndex > users.length) {
          return [];
        }

        const foundSignupQuestion = settings.signupQuestions.find(
          (signupQuestion) => signupQuestion.gameId === randomGame.gameId
        );

        const usersCount = getRandomInt(1, randomGame.maxAttendance);
        const usersChunk = users.slice(currentIndex, currentIndex + usersCount);

        currentIndex += usersCount;

        return usersChunk.map(async (user) => {
          await saveSignup({
            username: user.username,
            enteredGameId: randomGame.gameId,
            startTime: randomGame.startTime,
            message: foundSignupQuestion?.message ? faker.lorem.words(4) : "",
          });
        });
      });
    }
  );

  await Promise.all(promises);

  logger.info(`Generated ${promises.length} signups`);
};
