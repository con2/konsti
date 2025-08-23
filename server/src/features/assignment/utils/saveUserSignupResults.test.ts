import { expect, test, afterEach, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import {
  NotificationTaskType,
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";
import { findUsers, saveUser } from "server/features/user/userRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  mockLotterySignups,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { config } from "shared/config";
import { NullSender } from "server/features/notifications/nullSender";

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
    new NullSender(),
    1,
    true,
  );
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(queueService);
});

afterEach(async () => {
  vi.resetAllMocks();
  await mongoose.disconnect();
});

test("should add NEW_ASSIGNMENT and NO_ASSIGNMENT event log items and email notifications", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
  });

  const results: UserAssignmentResult[] = [
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());

  const usersWithAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
  });

  expect(usersWithAssignEventLogItem).toHaveLength(1);
  expect(usersWithAssignEventLogItem[0].username).toEqual(mockUser.username);

  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithNoAssignEventLogItem).toHaveLength(1);
  expect(usersWithNoAssignEventLogItem[0].username).toEqual(mockUser2.username);
});

test("should add NEW_ASSIGNMENT and NO_ASSIGNMENT event log items for 'startTimesByParentIds' program item", async () => {
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveUser(mockUser2);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
  });

  const results: UserAssignmentResult[] = [
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveUserSignupResults({
    assignmentTime: parentStartTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());

  const usersWithAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
  });

  expect(usersWithAssignEventLogItem).toHaveLength(1);
  expect(usersWithAssignEventLogItem[0].username).toEqual(mockUser.username);

  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithNoAssignEventLogItem).toHaveLength(1);
  expect(usersWithNoAssignEventLogItem[0].username).toEqual(mockUser2.username);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();

  expect(queueAfterUserSignup).toHaveLength(2);
  expect(queueAfterUserSignup[0].username).toEqual(mockUser.username);
  expect(queueAfterUserSignup[0].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  expect(queueAfterUserSignup[1].username).toEqual(mockUser2.username);
  expect(queueAfterUserSignup[1].type).toEqual(
    NotificationTaskType.SEND_EMAIL_REJECTED,
  );

  notificationQueueService.getQueue().resume();
  await notificationQueueService.getQueue().drained();
  const messages = (
    notificationQueueService.getSender() as NullSender
  ).getMessages();
  const expectedAcceptedBody = `Hei ${mockUser.username}!
Olet ollut onnekas ja paasit ohjelmaan Test program item
Ohjelma alkaa 2019-07-26T14:00:00.000Z.

Terveisin Konsti.`;
  const expectedAcceptedSubject =
    "Sinut on hyvaksytty ohjelmaan Test program item";
  const expectedRejectedBody = `Hei ${mockUser2.username}!
Et paassyt arvonnassa yhteenkaan ohjelmaan johon ilmoittauduit.

Terveisin Konsti.`;
  const expectedRejectedSubject = "Et paassyt arvonnassa yhteenkaan ohjelmaan";

  expect(messages[0].body).toEqual(expectedAcceptedBody);
  expect(messages[0].subject).toEqual(expectedAcceptedSubject);
  expect(messages[0].to).toEqual(["user@example.com"]);
  expect(messages[1].body).toEqual(expectedRejectedBody);
  expect(messages[1].subject).toEqual(expectedRejectedSubject);
  expect(messages[1].to).toEqual(["user@example.com"]);
});

test("should add NO_ASSIGNMENT event log item to group members", async () => {
  const groupCode = "abc-dfg-hij";

  await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
  await saveUser({ ...mockUser2, groupCode });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0] }],
  });

  const results: UserAssignmentResult[] = [];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());

  const usersWithAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
  });

  expect(usersWithAssignEventLogItem).toHaveLength(0);

  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithNoAssignEventLogItem).toHaveLength(2);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  expect(queueAfterUserSignup).toHaveLength(2);
  expect(queueAfterUserSignup[0].type).toEqual(
    NotificationTaskType.SEND_EMAIL_REJECTED,
  );
  expect(queueAfterUserSignup[1].type).toEqual(
    NotificationTaskType.SEND_EMAIL_REJECTED,
  );
});

test("should only add one event log item with multiple lottery signups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    {
      ...testProgramItem2,
      minAttendance: 1,
      maxAttendance: 1,
    },
  ]);

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      { ...mockLotterySignups[0], priority: 1 },
      {
        ...mockLotterySignups[1],
        priority: 2,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
  });

  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [
      { ...mockLotterySignups[0], priority: 3 },
      {
        ...mockLotterySignups[1],
        priority: 3,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
  });

  const results: UserAssignmentResult[] = [
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const usersWithAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
  });

  expect(usersWithAssignEventLogItem).toHaveLength(1);
  expect(usersWithAssignEventLogItem[0].username).toEqual(mockUser.username);
  expect(usersWithAssignEventLogItem[0].eventLogItems).lengthOf(1);
  expect(usersWithAssignEventLogItem[0].eventLogItems[0].action).toEqual(
    EventLogAction.NEW_ASSIGNMENT,
  );

  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithNoAssignEventLogItem).toHaveLength(1);
  expect(usersWithNoAssignEventLogItem[0].username).toEqual(mockUser2.username);
  expect(usersWithNoAssignEventLogItem[0].eventLogItems).lengthOf(1);
  expect(usersWithNoAssignEventLogItem[0].eventLogItems[0].action).toEqual(
    EventLogAction.NO_ASSIGNMENT,
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  expect(queueAfterUserSignup).toHaveLength(2);
  expect(queueAfterUserSignup[0].username).toEqual(mockUser.username);
  expect(queueAfterUserSignup[0].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  expect(queueAfterUserSignup[1].username).toEqual(mockUser2.username);
  expect(queueAfterUserSignup[1].type).toEqual(
    NotificationTaskType.SEND_EMAIL_REJECTED,
  );
});

test("should not add event log items after assigment if signup is dropped due to error", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 3 }]);

  const results: UserAssignmentResult[] = [
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    {
      username: mockUser2.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    {
      username: mockUser3.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    {
      username: mockUser4.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(3);
  expect(signupsAfterSave[0].userSignups).toHaveLength(3);

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const usersWithoutEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 0,
  );
  const usersWithEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 1,
  );
  expect(usersWithoutEventLogItem).toHaveLength(1);
  expect(usersWithEventLogItem).toHaveLength(3);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  expect(queueAfterUserSignup).toHaveLength(3);
  expect(queueAfterUserSignup[0].username).toEqual(mockUser.username);
  expect(queueAfterUserSignup[0].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  expect(queueAfterUserSignup[1].username).toEqual(mockUser3.username);
  expect(queueAfterUserSignup[1].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  expect(queueAfterUserSignup[2].username).toEqual(mockUser4.username);
  expect(queueAfterUserSignup[2].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
});
