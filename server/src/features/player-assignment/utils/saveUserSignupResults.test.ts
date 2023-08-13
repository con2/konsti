import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { findUsers, saveUser } from "server/features/user/userRepository";
import { testGame } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";
import {
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import { findSignups } from "server/features/signup/signupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { saveUserSignupResults } from "server/features/player-assignment/utils/saveUserSignupResults";
import { AssignmentResult } from "shared/typings/models/result";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("should not add event log items after assigment if signup is dropped due to error", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveGames([{ ...testGame, maxAttendance: 3 }]);

  const results: AssignmentResult[] = [
    {
      username: mockUser.username,
      enteredGame: {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    },
    {
      username: mockUser2.username,
      enteredGame: {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    },
    {
      username: mockUser3.username,
      enteredGame: {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    },
    {
      username: mockUser4.username,
      enteredGame: {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    },
  ];

  await saveUserSignupResults(testGame.startTime, results);

  const signupsAfterSave = unsafelyUnwrapResult(await findSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(3);
  expect(signupsAfterSave[0].userSignups).toHaveLength(3);

  const usersAfterSave = unsafelyUnwrapResult(await findUsers());
  const usersWithoutEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 0,
  );
  const usersWithEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 1,
  );
  expect(usersWithoutEventLogItem).toHaveLength(1);
  expect(usersWithEventLogItem).toHaveLength(3);
});
