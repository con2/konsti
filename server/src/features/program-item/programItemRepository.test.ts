import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import {
  findProgramItemById,
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import {
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { config } from "shared/config";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new program item into collection and add new direct signup document", async () => {
  await saveProgramItems([testProgramItem]);

  // Program item document
  const insertedProgramItem = unsafelyUnwrap(
    await findProgramItemById(testProgramItem.programItemId),
  );
  expect(insertedProgramItem.programItemId).toEqual(
    testProgramItem.programItemId,
  );

  // Direct signup document
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  expect(directSignups).toHaveLength(1);
  expect(directSignups[0].programItemId).toEqual(testProgramItem.programItemId);
});

test("should remove program item document and signup document when program item is removed", async () => {
  await saveProgramItems([testProgramItem]);

  // This will delete program item
  await saveProgramItems([]);

  // Program item document
  const programItems = unsafelyUnwrap(await findProgramItems());
  expect(programItems).toHaveLength(0);

  // Direct signup document
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  expect(directSignups).toHaveLength(0);
});

test("should remove lottery signups and favorites when program item is deleted and add notification", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  await saveFavorite({
    username: mockUser.username,
    favoriteProgramItemIds: [
      testProgramItem.programItemId,
      testProgramItem2.programItemId,
    ],
  });

  // This will delete program items
  await saveProgramItems([]);

  // Should have removed favorites and lottery signups
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(0);
  expect(user?.lotterySignups).toHaveLength(0);

  // Should have added new event log items
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove direct signups when program item is deleted and add notification", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  // This will delete program items
  await saveProgramItems([]);

  // Should have removed direct signup documents
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  expect(directSignups).toHaveLength(0);

  // Should have added new event log items
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove lottery signups but keep favorites when program item is cancelled before lottery and add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart + 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  await saveFavorite({
    username: mockUser.username,
    favoriteProgramItemIds: [
      testProgramItem.programItemId,
      testProgramItem2.programItemId,
    ],
  });

  await saveProgramItems([
    { ...testProgramItem, state: State.CANCELLED },
    { ...testProgramItem2, state: State.CANCELLED },
  ]);

  // Favorites are kept because the item still exists in DB
  // Lottery signups are removed (lottery hasn't run yet)
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(2);
  expect(user?.lotterySignups).toHaveLength(0);

  // Should have added new event log items
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove direct signups when program item is cancelled and add notification", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  await saveProgramItems([
    { ...testProgramItem, state: State.CANCELLED },
    { ...testProgramItem2, state: State.CANCELLED },
  ]);

  // Should not have removed direct signup documents
  const directSignupDocs = unsafelyUnwrap(await findDirectSignups());
  expect(directSignupDocs).toHaveLength(2);

  // Should have removed direct signups
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(0);

  // Should have added new event log items
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove lottery signups but not favorites when program item doesn't use Konsti signup anymore before lottery and add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart + 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  await saveFavorite({
    username: mockUser.username,
    favoriteProgramItemIds: [
      testProgramItem.programItemId,
      testProgramItem2.programItemId,
    ],
  });

  await saveProgramItems([
    { ...testProgramItem, signupType: SignupType.OTHER },
    { ...testProgramItem2, signupType: SignupType.OTHER },
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  // Should have kept favorites
  expect(user?.favoriteProgramItemIds).toHaveLength(2);
  // Should have removed lottery signups
  expect(user?.lotterySignups).toHaveLength(0);

  // Should have added new event log items
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should remove direct signups when program item doesn't use Konsti signup anymore and add notification", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  await saveProgramItems([
    { ...testProgramItem, signupType: SignupType.OTHER },
    { ...testProgramItem2, signupType: SignupType.OTHER },
  ]);

  // Should have removed direct signups
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(0);

  // Should have added new event log items
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should not add duplicate notification when program item is canceled and user has direct signup, lottery signup and favorite", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [mockLotterySignups[0]],
  });
  await saveFavorite({
    username: mockUser.username,
    favoriteProgramItemIds: [testProgramItem.programItemId],
  });

  await saveProgramItems([{ ...testProgramItem, state: State.CANCELLED }]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(1);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELED,
      }),
    ]),
  );
});

test("should preserve lottery signup when program item is cancelled after its lottery has run and not add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart - 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await saveProgramItems([
    { ...testProgramItem, state: State.CANCELLED },
    testProgramItem2,
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups).toHaveLength(2);
  const cancelEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_CANCELED,
  );
  expect(cancelEvents).toHaveLength(0);
});

test("should preserve lottery signup when signupType is changed away from Konsti after its lottery has run and not add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart - 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await saveProgramItems([
    { ...testProgramItem, signupType: SignupType.OTHER },
    testProgramItem2,
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups).toHaveLength(2);
  const cancelEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_CANCELED,
  );
  expect(cancelEvents).toHaveLength(0);
});

test("should remove lottery signup when programType is changed to non-lottery type before its lottery has run and add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart + 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await saveProgramItems([
    { ...testProgramItem, programType: ProgramType.OTHER },
    testProgramItem2,
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups).toHaveLength(1);
  expect(user?.lotterySignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );
  expect(user?.eventLogItems).toHaveLength(1);
  expect(user?.eventLogItems[0].programItemId).toEqual(
    testProgramItem.programItemId,
  );
  expect(user?.eventLogItems[0].action).toEqual(
    EventLogAction.PROGRAM_ITEM_CANCELED,
  );
});

test("should preserve lottery signup when programType is changed to non-lottery type after its lottery has run and not add notification", async () => {
  await saveTestSettings({
    testTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().directSignupPhaseStart - 1, "minutes")
      .toISOString(),
  });
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await saveProgramItems([
    { ...testProgramItem, programType: ProgramType.OTHER },
    testProgramItem2,
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups).toHaveLength(2);
  const cancelEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_CANCELED,
  );
  expect(cancelEvents).toHaveLength(0);
});

test("should add event notification if user has lottery signup and program item start time changes", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await saveProgramItems([
    {
      ...testProgramItem,
      startTime: dayjs(testProgramItem.startTime).add(1, "hour").toISOString(),
    },
    {
      ...testProgramItem2,
      startTime: dayjs(testProgramItem2.startTime)
        .add(2, "hours")
        .toISOString(),
    },
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));

  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      }),
    ]),
  );
});

test("should add event notification if user has direct signup and program item start time changes", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup(mockPostDirectSignupRequest2);

  await saveProgramItems([
    {
      ...testProgramItem,
      startTime: dayjs(testProgramItem.startTime).add(1, "hour").toISOString(),
    },
    {
      ...testProgramItem2,
      startTime: dayjs(testProgramItem2.startTime).add(2, "hour").toISOString(),
    },
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(2);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      }),
    ]),
  );
});
