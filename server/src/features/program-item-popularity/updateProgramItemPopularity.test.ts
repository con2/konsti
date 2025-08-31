import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { Popularity, ProgramType } from "shared/types/models/programItem";
import { config } from "shared/config";

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

  const timeNow = dayjs(testProgramItem.startTime)
    .add(1, "hours")
    .toISOString();
  vi.setSystemTime(timeNow);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1 },
    {
      ...testProgramItem2,
      minAttendance: 1,
      startTime: dayjs(testProgramItem.startTime).add(2, "hours").toISOString(),
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
        signedToStartTime: dayjs(testProgramItem.startTime)
          .add(2, "hours")
          .toISOString(),
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
  const timeNow = dayjs(testProgramItem.startTime)
    .add(1, "hours")
    .toISOString();
  const parentStartTime = dayjs(timeNow).add(1, "hour").toISOString();
  const upcomingStartTime = dayjs(timeNow).add(2, "hours").toISOString();

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
  const timeNow = dayjs(testProgramItem.startTime)
    .add(1, "hours")
    .toISOString();
  const parentStartTime = dayjs(timeNow).subtract(30, "minutes").toISOString();
  const upcomingStartTime = dayjs(timeNow).add(2, "hours").toISOString();

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
