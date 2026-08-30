import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import { addHours, subHours, subMinutes } from "date-fns";
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
    dbName: randomUUID(),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

test("Should update program item popularity", async () => {
  // Inside the lottery sign-up window: popularity measures demand for the lottery, so it is
  // only simulated while that is still ahead
  vi.setSystemTime(
    subHours(new Date(testProgramItem.startTime), 3).toISOString(),
  );

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
      startTime: addHours(new Date(testProgramItem.startTime), 4).toISOString(),
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
          4,
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
  const parentStartTime = addHours(new Date(timeNow), 3).toISOString();
  const upcomingStartTime = addHours(new Date(timeNow), 4).toISOString();

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

test("Should not update popularity once the lottery sign-up has closed", async () => {
  // Between the lottery running and the program item starting, the figures popularity is
  // derived from no longer mean demand: capacity is reduced by the spots just handed out
  // while every attendee still competes for what is left. A start time is never simulated
  // again once it has passed, so a value written here would be the one kept for good.
  const timeNow = subMinutes(
    new Date(testProgramItem.startTime),
    60,
  ).toISOString();
  vi.setSystemTime(timeNow);

  await saveProgramItems([{ ...testProgramItem, minAttendance: 1 }]);
  await saveUser(mockUser);
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
