import { faker } from "@faker-js/faker";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { findUsers } from "server/features/user/userRepository";
import { findGames } from "server/features/game/gameRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { shuffleArray } from "server/utils/shuffleArray";
import { getRandomInt } from "server/features/player-assignment/utils/getRandomInt";
import { saveEnteredGame } from "server/features/user/entered-game/enteredGameRepository";

export const createEnteredGames = async (): Promise<void> => {
  logger.info(`Generate EnteredGames data`);

  const games = await findGames();
  const allUsers = await findUsers();
  const settings = await findSettings();

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper"
  );

  logger.info(`EnteredGames: ${games.length} games`);
  logger.info(`EnteredGames: ${users.length} users`);

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
          await saveEnteredGame({
            username: user.username,
            enteredGameId: randomGame.gameId,
            startTime: randomGame.startTime,
            // TODO: If private, add email + phone
            message: foundSignupQuestion?.message ? faker.lorem.words(4) : "",
          });
        });
      });
    }
  );

  await Promise.all(promises);

  logger.info(`Generated ${promises.length} entered games`);
};
