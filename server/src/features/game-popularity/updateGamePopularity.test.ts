import { Server } from "http";
import { expect, test, afterEach, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  findGames,
  saveGames,
} from "server/features/program-item/programItemRepository";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

test(`Should update game popularity`, async () => {
  vi.setSystemTime(testGame.startTime);

  await saveGames([testGame, testGame2]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveLotterySignups({
    lotterySignups: [
      {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    ],
    username: mockUser.username,
  });
  await saveLotterySignups({
    lotterySignups: [
      {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    ],
    username: mockUser2.username,
  });

  const gamesResult = await findGames();
  const games = unsafelyUnwrapResult(gamesResult);
  expect(games.length).toEqual(2);
  const firstGame = games.find((game) => game.gameId === testGame.gameId);
  expect(firstGame?.popularity).toEqual(0);
  const secondGame = games.find((game) => game.gameId === testGame2.gameId);
  expect(secondGame?.popularity).toEqual(0);

  await updateGamePopularity();

  const updatedGamesResult = await findGames();
  const updatedGames = unsafelyUnwrapResult(updatedGamesResult);
  expect(updatedGames.length).toEqual(2);
  const updatedFirstGame = updatedGames.find(
    (game) => game.gameId === testGame.gameId,
  );
  expect(updatedFirstGame?.popularity).toEqual(2);
  const updatedSecondGame = updatedGames.find(
    (game) => game.gameId === testGame2.gameId,
  );
  expect(updatedSecondGame?.popularity).toEqual(0);
});

test(`Should only update game popularity of upcoming program items`, async () => {
  const timeNow = dayjs(testGame.startTime).add(1, "hours").toISOString();
  vi.setSystemTime(timeNow);

  await saveGames([
    { ...testGame, minAttendance: 1 },
    {
      ...testGame2,
      minAttendance: 1,
      startTime: dayjs(testGame.startTime).add(2, "hours").toISOString(),
    },
  ]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  // Past program item
  await saveLotterySignups({
    lotterySignups: [
      {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    ],
    username: mockUser.username,
  });

  // Upcoming program item
  await saveLotterySignups({
    lotterySignups: [
      {
        gameDetails: testGame2,
        priority: 1,
        time: dayjs(testGame.startTime).add(2, "hours").toISOString(),
        message: "",
      },
    ],
    username: mockUser2.username,
  });

  const games = unsafelyUnwrapResult(await findGames());
  expect(games.length).toEqual(2);

  const firstGame = games.find((game) => game.gameId === testGame.gameId);
  expect(firstGame?.popularity).toEqual(0);
  const secondGame = games.find((game) => game.gameId === testGame2.gameId);
  expect(secondGame?.popularity).toEqual(0);

  await updateGamePopularity();

  const updatedGames = unsafelyUnwrapResult(await findGames());
  expect(updatedGames.length).toEqual(2);

  const updatedFirstGame = updatedGames.find(
    (game) => game.gameId === testGame.gameId,
  );
  expect(updatedFirstGame?.popularity).toEqual(0);

  const updatedSecondGame = updatedGames.find(
    (game) => game.gameId === testGame2.gameId,
  );
  expect(updatedSecondGame?.popularity).toEqual(1);
});
