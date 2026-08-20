import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import { addHours, subMinutes } from "date-fns";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Popularity, ProgramType } from "shared/types/models/programItem";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

test("Should update program item popularity", async () => {
  vi.setSystemTime(testProgramItem.startTime);

  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
    username: mockUser.username,
  });
  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
    username: mockUser2.username,
  });

  const programItems = unsafelyUnwrap(await findProgramItems());

  expect(programItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );

  await updateProgramItemPopularity();

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());

  expect(updatedProgramItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.MEDIUM,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );
});

test("Should only update program item popularity of upcoming program items", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });

  const timeNow = addHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();
  vi.setSystemTime(timeNow);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1 },
    {
      ...testProgramItem2,
      minAttendance: 1,
      startTime: addHours(new Date(testProgramItem.startTime), 2).toISOString(),
    },
  ]);
  await saveUser(mockUser);
  await saveUser(mockUser2);

  // Past program item
  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
    username: mockUser.username,
  });

  // Upcoming program item
  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem2.programItemId,
        priority: 1,
        signedToStartTime: addHours(
          new Date(testProgramItem.startTime),
          2,
        ).toISOString(),
      },
    ],
    username: mockUser2.username,
  });

  const programItems = unsafelyUnwrap(await findProgramItems());

  expect(programItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );

  await updateProgramItemPopularity();

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());

  expect(updatedProgramItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        popularity: Popularity.MEDIUM,
      }),
    ]),
  );
});

test("Should update popularity of upcoming program item with parent", async () => {
  const timeNow = addHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();
  const parentStartTime = addHours(new Date(timeNow), 1).toISOString();
  const upcomingStartTime = addHours(new Date(timeNow), 2).toISOString();

  vi.setSystemTime(timeNow);
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);

  // Upcoming program item with parent
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, startTime: upcomingStartTime },
  ]);

  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
    ],
    username: mockUser.username,
  });

  const programItems = unsafelyUnwrap(await findProgramItems());

  expect(programItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );

  await updateProgramItemPopularity();

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());

  expect(updatedProgramItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.MEDIUM,
      }),
    ]),
  );
});

test("Should not update upcoming program item popularity if parent starTime in past", async () => {
  const timeNow = addHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();
  const parentStartTime = subMinutes(new Date(timeNow), 30).toISOString();
  const upcomingStartTime = addHours(new Date(timeNow), 2).toISOString();

  vi.setSystemTime(timeNow);
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);

  // Upcoming program item with parent in past
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, startTime: upcomingStartTime },
  ]);

  await saveLotterySignups({
    lotterySignups: [
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
    ],
    username: mockUser.username,
  });

  const programItems = unsafelyUnwrap(await findProgramItems());

  expect(programItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );

  await updateProgramItemPopularity();

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());

  expect(updatedProgramItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        popularity: Popularity.NULL,
      }),
    ]),
  );
});
