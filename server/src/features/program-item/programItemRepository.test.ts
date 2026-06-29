import { expect, test, afterEach, beforeEach, vi } from "vitest";
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
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
  NotificationTaskType,
} from "server/utils/notificationQueue";
import { EmailSender } from "server/features/notifications/email";

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(),
    };
  },
);

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });

  const queueService = createNotificationQueueService(
    new EmailSender(),
    1,
    true,
  );
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);
});

afterEach(async () => {
  vi.resetAllMocks();
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
        action: EventLogAction.PROGRAM_ITEM_DELETED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_DELETED,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
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
        action: EventLogAction.PROGRAM_ITEM_DELETED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_DELETED,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_DELETED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
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
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
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
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_CANCELLED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
      }),
    ]),
  );
});

test("should send email when program item is cancelled", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);

  await saveProgramItems([{ ...testProgramItem, state: State.CANCELLED }]);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService = getGlobalNotificationQueueService()!;
  queueService.getQueue().resume();
  await queueService.getQueue().drained();

  expect(queueService.getSender().getSentEmails()).toHaveLength(1);
});

test("should send email when program item is deleted", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);

  // This will delete the program item
  await saveProgramItems([]);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService = getGlobalNotificationQueueService()!;
  queueService.getQueue().resume();
  await queueService.getQueue().drained();

  expect(queueService.getSender().getSentEmails()).toHaveLength(1);
});

test("should send email when program item start time changes", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);

  await saveProgramItems([
    {
      ...testProgramItem,
      startTime: dayjs(testProgramItem.startTime).add(1, "hour").toISOString(),
    },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService = getGlobalNotificationQueueService()!;
  queueService.getQueue().resume();
  await queueService.getQueue().drained();

  expect(queueService.getSender().getSentEmails()).toHaveLength(1);
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
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService416 = getGlobalNotificationQueueService()!;
  const queuedNotifications = queueService416.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
      }),
    ]),
  );

  queueService416.getQueue().resume();
  await queueService416.getQueue().drained();
  expect(queueService416.getSender().getSentEmails()).toHaveLength(2);
});

test("should keep direct signup when program item programType is changed to non-lottery type and don't add notification", async () => {
  await saveProgramItems([testProgramItem]);
  await saveUser(mockUser);
  await saveDirectSignup(mockPostDirectSignupRequest);

  await saveProgramItems([
    { ...testProgramItem, programType: ProgramType.OTHER },
  ]);

  // Direct signup remains valid — the item still exists and still uses Konsti signup
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toHaveLength(1);

  // No notification should be added — direct signups stay valid on a program type change
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  const noLotteryAnymoreEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
  );
  expect(noLotteryAnymoreEvents).toHaveLength(0);
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
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      }),
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService475 = getGlobalNotificationQueueService()!;
  const queuedNotifications2 = queueService475.getItems();
  expect(queuedNotifications2).toHaveLength(2);
  expect(queuedNotifications2).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
      }),
    ]),
  );

  queueService475.getQueue().resume();
  await queueService475.getQueue().drained();
  expect(queueService475.getSender().getSentEmails()).toHaveLength(2);
});

test("should not add duplicate notification when program item is cancelled and user has direct signup, lottery signup and favorite", async () => {
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
        action: EventLogAction.PROGRAM_ITEM_CANCELLED,
      }),
    ]),
  );

  expect(getGlobalNotificationQueueService()?.getItems()).toHaveLength(1);
});

test("should not add duplicate notification when signupType is changed away from Konsti and user has direct signup, lottery signup and favorite", async () => {
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

  await saveProgramItems([
    { ...testProgramItem, signupType: SignupType.OTHER },
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(1);
  expect(user?.eventLogItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        action: EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
      }),
    ]),
  );
});

test("should not add any notification when programType is changed to non-lottery type and user has direct signup, lottery signup and favorite", async () => {
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

  await saveProgramItems([
    { ...testProgramItem, programType: ProgramType.OTHER },
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toHaveLength(0);
  expect(getGlobalNotificationQueueService()?.getItems()).toHaveLength(0);
});

test("should preserve lottery signup when program item is cancelled after its lottery has run but not add notification because the user didn't get a spot", async () => {
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
    (e) => e.action === EventLogAction.PROGRAM_ITEM_CANCELLED,
  );
  expect(cancelEvents).toHaveLength(0);
});

test("should preserve lottery signup when signupType is changed away from Konsti after its lottery has run but not add notification because the user didn't get a spot", async () => {
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
  const signupTypeChangedEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
  );
  expect(signupTypeChangedEvents).toHaveLength(0);
});

test("should remove lottery signup but keep favorites when programType is changed to non-lottery type before its lottery has run and add notification", async () => {
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
    { ...testProgramItem, programType: ProgramType.OTHER },
    testProgramItem2,
  ]);

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.favoriteProgramItemIds).toHaveLength(2);
  expect(user?.lotterySignups).toHaveLength(1);
  expect(user?.lotterySignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );
  expect(user?.eventLogItems).toHaveLength(1);
  expect(user?.eventLogItems[0].programItemId).toEqual(
    testProgramItem.programItemId,
  );
  expect(user?.eventLogItems[0].action).toEqual(
    EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queueService649 = getGlobalNotificationQueueService()!;
  const queuedNotifications3 = queueService649.getItems();
  expect(queuedNotifications3).toHaveLength(1);
  expect(queuedNotifications3[0]).toEqual(
    expect.objectContaining({
      type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
      username: mockUser.username,
      programItemId: testProgramItem.programItemId,
      programItemTitle: testProgramItem.title,
    }),
  );

  queueService649.getQueue().resume();
  await queueService649.getQueue().drained();
  expect(queueService649.getSender().getSentEmails()).toHaveLength(1);
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
  const noLotteryAnymoreEvents = user?.eventLogItems.filter(
    (e) => e.action === EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
  );
  expect(noLotteryAnymoreEvents).toHaveLength(0);
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queuedNotifications = getGlobalNotificationQueueService()!.getItems();
  expect(queuedNotifications).toHaveLength(2);
  expect(queuedNotifications).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
        username: mockUser.username,
        programItemId: testProgramItem.programItemId,
        programItemTitle: testProgramItem.title,
      }),
      expect.objectContaining({
        type: NotificationTaskType.SEND_EMAIL_PROGRAM_ITEM_TIME_CHANGED,
        username: mockUser.username,
        programItemId: testProgramItem2.programItemId,
        programItemTitle: testProgramItem2.title,
      }),
    ]),
  );
});
