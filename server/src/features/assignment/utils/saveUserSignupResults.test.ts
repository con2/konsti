import { randomUUID } from "node:crypto";
import { addMinutes, subHours } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import { makeErrorResult } from "shared/utils/result";
import { db } from "server/db/mongodb";
import { addAssignmentNotifications } from "server/features/assignment/utils/addAssignmentNotifications";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import {
  findDirectSignups,
  findDirectSignupsByProgramItemIds,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { EmailSender } from "server/features/notifications/email";
import { EmailMessage } from "server/features/notifications/senderCommon";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  NotificationTaskType,
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";

// Kept as the real implementation, so only the case that needs a failed read replaces it.
// vi.fn(impl) survives the resetAllMocks below, which restores the implementation it was given
vi.mock(
  import("server/features/direct-signup/directSignupRepository"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      findDirectSignupsByProgramItemIds: vi.fn(
        actual.findDirectSignupsByProgramItemIds,
      ),
    };
  },
);

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
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());

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

interface SaveAndNotifyParams {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  users: User[];
  programItems: ProgramItem[];
  // A run lotteries the program items starting at its time, so it defaults to those rather
  // than to everything a case seeds
}

// A run saves the spots and then tells the attendees, so the cases below drive both steps
// in that order rather than either one alone
const saveAndNotify = async ({
  assignmentTime,
  results,
  users,
  programItems,
}: SaveAndNotifyParams): Promise<void> => {
  const finalResults = unsafelyUnwrap(
    await saveUserSignupResults({
      assignmentTime,
      results,
      users,
      programItems,
    }),
  );

  await addAssignmentNotifications({
    assignmentTime,
    finalResults,
    users,
    programItems,
  });
};

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

  await saveAndNotify({
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
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

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

  await saveAndNotify({
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

  // The hour the attendee turns up, not the parent hour the run was scheduled at
  const newAssignmentItems =
    usersWithAssignEventLogItem[0].eventLogItems.filter(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
  expect(newAssignmentItems).toHaveLength(1);
  expect(newAssignmentItems[0].programItemStartTime).toEqual(
    testProgramItem.startTime,
  );

  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithNoAssignEventLogItem).toHaveLength(1);
  expect(usersWithNoAssignEventLogItem[0].username).toEqual(mockUser2.username);

  // One starting time in the batch, so the rejection names that hour and records no span
  const noAssignmentItems =
    usersWithNoAssignEventLogItem[0].eventLogItems.filter(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  expect(noAssignmentItems).toHaveLength(1);
  expect(noAssignmentItems[0].programItemStartTime).toEqual(
    testProgramItem.startTime,
  );
  expect(noAssignmentItems[0].lotteriedUntil).toBeUndefined();

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
  const messages: EmailMessage[] = notificationQueueService
    .getSender()
    .getSentEmails();
  const expectedAcceptedBody = `Hei ${mockUser.username}!
Olet ollut onnekas ja pääsit ohjelmaan Test program item.
Ohjelma alkaa pe 26.7.2019 17:00.

Hi Test User!
You got a spot in the program Test program item.
The program will start at Fri 26.7.2019 17:00.

Terveisin / Sincerely Konsti`;
  const expectedAcceptedSubject =
    "Konsti-arvonnan tulos / Results for Konsti lottery sign-up";
  // The hour the attendee's program item starts, not the parent hour the run was scheduled at
  const expectedRejectedBody = `Hei ${mockUser2.username}!
Paikat pe 26.7.2019 17:00 alkaviin ohjelmanumeroihin arvottiin.
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.

Hi Test User 2!
Spots for program items starting at Fri 26.7.2019 17:00 were randomized.
Unfortunately you did not get a spot in the lottery sign-up.

Terveisin / Sincerely Konsti`;
  const expectedRejectedSubject =
    "Konsti-arvonnan tulos / Results for Konsti lottery sign-up";

  expect(messages).toHaveLength(2);
  expect(messages[0].text).toEqual(expectedAcceptedBody);
  expect(messages[0].subject).toEqual(expectedAcceptedSubject);
  expect(messages[0].to).toEqual("user@example.com");
  expect(messages[1].text).toEqual(expectedRejectedBody);
  expect(messages[1].subject).toEqual(expectedRejectedSubject);
  expect(messages[1].to).toEqual("user@example.com");
});

test("should add NO_ASSIGNMENT event log item to group members", async () => {
  const groupCode = "abc-dfg-hij";

  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
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

  await saveAndNotify({
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

  await saveAndNotify({
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

test("should not add event log items after assignment if signup is dropped due to error", async () => {
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

  await saveAndNotify({
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
  expect(
    queueAfterUserSignup.every(
      (task) => task.type == NotificationTaskType.SEND_EMAIL_ACCEPTED,
    ),
  ).toEqual(true);
});

test("should give dropped signup users a NO_ASSIGNMENT message when multiple signups are dropped due to error", async () => {
  const lotteryUsers = [mockUser, mockUser2, mockUser3, mockUser4];
  for (const user of lotteryUsers) {
    await saveUser(user);
  }
  // Only two seats, but four assignment results are passed -> two sign-ups dropped
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  // All four are real lottery participants for the starting program item
  for (const user of lotteryUsers) {
    await saveLotterySignups({
      username: user.username,
      lotterySignups: [{ ...mockLotterySignups[0] }],
    });
  }

  const results: UserAssignmentResult[] = lotteryUsers.map((user) => ({
    username: user.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  }));

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // Only two sign-ups fit, the other two are dropped
  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);

  const usersAfterSave = unsafelyUnwrap(await findUsers());

  // The two users whose sign-ups were saved get a NEW_ASSIGNMENT message
  const usersWithNewAssignment = usersAfterSave.filter((user) =>
    user.eventLogItems.some(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    ),
  );
  expect(usersWithNewAssignment).toHaveLength(2);

  // The two users whose sign-ups were dropped get a NO_ASSIGNMENT message instead of silence
  const usersWithNoAssignment = usersAfterSave.filter((user) =>
    user.eventLogItems.some(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    ),
  );
  expect(usersWithNoAssignment).toHaveLength(2);

  // Every lottery participant gets exactly one message, and no user gets both
  const usersWithExactlyOneEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length === 1,
  );
  expect(usersWithExactlyOneEventLogItem).toHaveLength(4);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  const acceptedNotifications = queueAfterUserSignup.filter(
    (task) => task.type === NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  const rejectedNotifications = queueAfterUserSignup.filter(
    (task) => task.type === NotificationTaskType.SEND_EMAIL_REJECTED,
  );
  expect(acceptedNotifications).toHaveLength(2);
  expect(rejectedNotifications).toHaveLength(2);
});

test("should remove all of a winner's existing same-time direct signups, not just one", async () => {
  const alwaysOpenId1 = "always-open-1";
  const alwaysOpenId2 = "always-open-2";

  // Always-open sign-ups survive the pre-assignment cleanup, so the user keeps both existing
  // direct sign-ups at the assignment start time going into conflict resolution
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    directSignupAlwaysOpenIds: [alwaysOpenId1, alwaysOpenId2],
  });

  await saveUser(mockUser);

  await saveProgramItems([
    { ...testProgramItem, maxAttendance: 10 },
    {
      ...testProgramItem2,
      programItemId: alwaysOpenId1,
      startTime: testProgramItem.startTime,
      maxAttendance: 10,
    },
    {
      ...testProgramItem2,
      programItemId: alwaysOpenId2,
      startTime: testProgramItem.startTime,
      maxAttendance: 10,
    },
  ]);

  // Two existing direct sign-ups for the same start time
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    directSignupProgramItemId: alwaysOpenId1,
    signedToStartTime: testProgramItem.startTime,
  });
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    directSignupProgramItemId: alwaysOpenId2,
    signedToStartTime: testProgramItem.startTime,
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

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // Both prior same-time sign-ups must be removed, leaving only the assignment result
  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  const userProgramItemIds = signupsAfterSave.flatMap((signup) =>
    signup.userSignups
      .filter((userSignup) => userSignup.username === mockUser.username)
      .map(() => signup.programItemId),
  );
  expect(userProgramItemIds).toEqual([testProgramItem.programItemId]);
});

test("should not send notifications to users without email addresses but still create event log items", async () => {
  const userWithoutEmail = { ...mockUser, email: "" };
  const userWithEmail = mockUser2;

  await saveUser(userWithoutEmail);
  await saveUser(userWithEmail);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: userWithoutEmail.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });
  await saveLotterySignups({
    username: userWithEmail.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
  });

  const results: UserAssignmentResult[] = [
    {
      username: userWithoutEmail.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
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
  const usersWithNoAssignEventLogItem = usersAfterSave.filter((user) => {
    return user.eventLogItems.find(
      (eventLogItem) => eventLogItem.action === EventLogAction.NO_ASSIGNMENT,
    );
  });

  expect(usersWithAssignEventLogItem).toHaveLength(1);
  expect(usersWithAssignEventLogItem[0].username).toEqual(
    userWithoutEmail.username,
  );
  expect(usersWithNoAssignEventLogItem).toHaveLength(1);
  expect(usersWithNoAssignEventLogItem[0].username).toEqual(
    userWithEmail.username,
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();

  expect(queueAfterUserSignup).toHaveLength(2);
  expect(queueAfterUserSignup[0].username).toEqual(userWithoutEmail.username);
  expect(queueAfterUserSignup[0].type).toEqual(
    NotificationTaskType.SEND_EMAIL_ACCEPTED,
  );
  expect(queueAfterUserSignup[1].username).toEqual(userWithEmail.username);
  expect(queueAfterUserSignup[1].type).toEqual(
    NotificationTaskType.SEND_EMAIL_REJECTED,
  );

  notificationQueueService.getQueue().resume();
  await notificationQueueService.getQueue().drained();

  const messages = notificationQueueService.getSender().getSentEmails();
  expect(messages).toHaveLength(1);
  expect(messages[0].to).toEqual(userWithEmail.email);
});

test("should respect email notification permissions based on email field", async () => {
  const userWithEmail = {
    ...mockUser,
    emailNotificationPermitAsked: true,
    email: "user@example.com",
  };
  const userWithoutEmail = {
    ...mockUser2,
    emailNotificationPermitAsked: true,
    email: "",
  };

  await saveUser(userWithEmail);
  await saveUser(userWithoutEmail);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: userWithEmail.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });
  await saveLotterySignups({
    username: userWithoutEmail.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 2 }],
  });

  const results: UserAssignmentResult[] = [
    {
      username: userWithEmail.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const usersWithEventLogItems = usersAfterSave.filter(
    (user) => user.eventLogItems.length > 0,
  );
  expect(usersWithEventLogItems).toHaveLength(2);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  expect(queueAfterUserSignup).toHaveLength(2);

  notificationQueueService.getQueue().resume();
  await notificationQueueService.getQueue().drained();

  const messages = notificationQueueService.getSender().getSentEmails();
  expect(messages).toHaveLength(1);
  expect(messages[0].to).toEqual(userWithEmail.email);
  expect(messages[0].subject).toEqual(
    "Konsti-arvonnan tulos / Results for Konsti lottery sign-up",
  );
});

test("should handle mixed email permissions in groups", async () => {
  const groupCode = "abc-dfg-hij";
  const userWithEmail = {
    ...mockUser,
    groupCode,
    isGroupCreator: true,
    emailNotificationPermitAsked: true,
    email: "user1@example.com",
  };
  const userWithoutEmail = {
    ...mockUser2,
    groupCode,
    emailNotificationPermitAsked: true,
    email: "",
  };

  await saveUser(userWithEmail);
  await saveUser(userWithoutEmail);

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);

  await saveLotterySignups({
    username: userWithEmail.username,
    lotterySignups: [{ ...mockLotterySignups[0] }],
  });

  const results: UserAssignmentResult[] = [];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const usersWithEventLogItem = usersAfterSave.filter(
    (user) => user.eventLogItems.length > 0,
  );
  expect(usersWithEventLogItem).toHaveLength(2);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  const queueAfterUserSignup = notificationQueueService.getItems();
  expect(queueAfterUserSignup).toHaveLength(2);
  expect(
    queueAfterUserSignup.every(
      (item) => item.type === NotificationTaskType.SEND_EMAIL_REJECTED,
    ),
  ).toBe(true);

  notificationQueueService.getQueue().resume();
  await notificationQueueService.getQueue().drained();

  const messages = notificationQueueService.getSender().getSentEmails();
  expect(messages).toHaveLength(1);
  expect(messages[0].to).toEqual(userWithEmail.email);
  expect(messages[0].subject).toEqual(
    "Konsti-arvonnan tulos / Results for Konsti lottery sign-up",
  );
});

// The parent batches the lottery; the spot itself belongs to the hour its attendee turns up
test("should store the won slot's own start time on a batched program item's signup", async () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
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

  unsafelyUnwrap(
    await saveUserSignupResults({
      // The run is keyed on the batch's time, which the stored sign-up must not take
      assignmentTime: parentStartTime,
      results,
      users: unsafelyUnwrap(await findUsers()),
      programItems: unsafelyUnwrap(await findProgramItems()),
    }),
  );

  const signups = unsafelyUnwrap(await findDirectSignups());
  const userSignup = signups
    .flatMap((signup) => signup.userSignups)
    .find((signup) => signup.username === mockUser.username);

  expect(new Date(userSignup?.signedToStartTime ?? "").toISOString()).toEqual(
    new Date(testProgramItem.startTime).toISOString(),
  );
});

// The parent batches the lottery, so a run for it places attendees at several different hours.
// A spot only gives way to one they cannot attend alongside it
test("should keep a spot held at another hour when a batched lottery places the attendee", async () => {
  // The batch is lotteried at its own configured time, distinct from either sub-session's hour
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    -30,
  ).toISOString();
  const laterStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    60,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    // Same batch, so one lottery covers both, but it runs an hour later
    {
      ...testProgramItem2,
      parentId: testProgramItem.parentId,
      startTime: laterStartTime,
    },
  ]);

  // They already hold a spot in the later sub-session
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    directSignupProgramItemId: testProgramItem2.programItemId,
    signedToStartTime: laterStartTime,
  });

  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  unsafelyUnwrap(
    await saveUserSignupResults({
      assignmentTime: parentStartTime,
      results: [
        {
          username: mockUser.username,
          assignmentSignup: {
            programItemId: testProgramItem.programItemId,
            priority: 1,
            signedToStartTime: testProgramItem.startTime,
          },
        },
      ],
      users: unsafelyUnwrap(await findUsers()),
      programItems: unsafelyUnwrap(await findProgramItems()),
    }),
  );

  const signups = unsafelyUnwrap(await findDirectSignups());
  const heldProgramItemIds = signups
    .filter((signup) =>
      signup.userSignups.some(
        (userSignup) => userSignup.username === mockUser.username,
      ),
    )
    .map((signup) => signup.programItemId);

  // The won spot is added and the one at the other hour is left alone
  expect(new Set(heldProgramItemIds)).toEqual(
    new Set([testProgramItem.programItemId, testProgramItem2.programItemId]),
  );
});

test("should replace a winner's own direct signup for the program item they win", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);

  // Room for both winners, one of whom is already in the program item
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser.username,
  });

  const results: UserAssignmentResult[] = [mockUser, mockUser2].map((user) => ({
    username: user.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  }));

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const [signup] = unsafelyUnwrap(await findDirectSignups());

  // The spot they already held is rewritten, not added beside itself
  const mockUserSignups = signup.userSignups.filter(
    (userSignup) => userSignup.username === mockUser.username,
  );
  expect(mockUserSignups).toHaveLength(1);
  expect(mockUserSignups[0].priority).toEqual(1);

  // The spot they held was theirs either way, so it never counted against the other winner
  const usernames = signup.userSignups.map((userSignup) => userSignup.username);
  expect(usernames).toEqual(
    expect.arrayContaining([mockUser.username, mockUser2.username]),
  );
  expect(signup.count).toEqual(2);
});

// Two consecutive half hour slots lotteried as one batch, the way a fleamarket day is, with
// the run scheduled at a parent hour neither of them starts at
const saveBatchedProgramItems = async (): Promise<{
  parentStartTime: string;
  firstProgramItem: ProgramItem;
  laterProgramItem: ProgramItem;
}> => {
  const parentStartTime = subHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();
  const firstProgramItem = {
    ...testProgramItem,
    endTime: addMinutes(new Date(testProgramItem.startTime), 30).toISOString(),
  };
  const laterProgramItem = {
    ...testProgramItem2,
    programType: testProgramItem.programType,
    parentId: testProgramItem.parentId,
    startTime: addMinutes(
      new Date(testProgramItem.startTime),
      30,
    ).toISOString(),
    endTime: addMinutes(new Date(testProgramItem.startTime), 60).toISOString(),
  };

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveProgramItems([firstProgramItem, laterProgramItem]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  return { parentStartTime, firstProgramItem, laterProgramItem };
};

test("should record the whole span a batched lottery covered on its rejections", async () => {
  const { parentStartTime, laterProgramItem } = await saveBatchedProgramItems();

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  // Nobody is placed, so the one lottery participant is rejected
  await saveAndNotify({
    assignmentTime: parentStartTime,
    results: [],
    users,
    programItems,
  });

  const [userAfterSave] = unsafelyUnwrap(await findUsers());
  const noAssignmentItems = userAfterSave.eventLogItems.filter(
    (item) => item.action === EventLogAction.NO_ASSIGNMENT,
  );
  expect(noAssignmentItems).toHaveLength(1);

  // First start to last end, which is the range the batch's titles show
  expect(noAssignmentItems[0].programItemStartTime).toEqual(
    testProgramItem.startTime,
  );
  expect(noAssignmentItems[0].lotteriedUntil).toEqual(laterProgramItem.endTime);
  expect(noAssignmentItems[0].programType).toEqual(testProgramItem.programType);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const notificationQueueService = getGlobalNotificationQueueService()!;
  notificationQueueService.getQueue().resume();
  await notificationQueueService.getQueue().drained();
  const sentMessages = notificationQueueService.getSender().getSentEmails();
  expect(sentMessages).toHaveLength(1);
  const [rejectedMessage] = sentMessages;

  // The same span and program type the event log names, worded as a range because the far end
  // is an end time rather than a start
  expect(rejectedMessage.text).toEqual(`Hei ${mockUser.username}!
Roolipelit välillä pe 26.7.2019 17:00 - pe 26.7.2019 18:00 arvottiin.
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.

Hi ${mockUser.username}!
Role-playing games between Fri 26.7.2019 17:00 and Fri 26.7.2019 18:00 were lotteried.
Unfortunately you did not get a spot in the lottery sign-up.

Terveisin / Sincerely Konsti`);
});

test("should not record a span when the lottery covered a single starting time", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results: [],
    users,
    programItems,
  });

  const [userAfterSave] = unsafelyUnwrap(await findUsers());
  const noAssignmentItems = userAfterSave.eventLogItems.filter(
    (item) => item.action === EventLogAction.NO_ASSIGNMENT,
  );
  expect(noAssignmentItems).toHaveLength(1);

  expect(noAssignmentItems[0].programItemStartTime).toEqual(
    testProgramItem.startTime,
  );
  expect(noAssignmentItems[0].lotteriedUntil).toBeUndefined();
  expect(noAssignmentItems[0].programType).toBeUndefined();
});

test("should span a rejection over the batch, whichever slots were lotteried", async () => {
  // The later slot was passed over for holding sign-ups, so only the first went through a
  // lottery - but both were part of the batch the attendee entered, so both are in the span
  const { parentStartTime, firstProgramItem, laterProgramItem } =
    await saveBatchedProgramItems();

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: parentStartTime,
    results: [],
    users,
    programItems,
  });

  const [userAfterSave] = unsafelyUnwrap(await findUsers());
  const noAssignmentItems = userAfterSave.eventLogItems.filter(
    (item) => item.action === EventLogAction.NO_ASSIGNMENT,
  );
  expect(noAssignmentItems).toHaveLength(1);

  // The parent hour is when the run was scheduled, and no slot the attendee saw starts then
  expect(noAssignmentItems[0].programItemStartTime).not.toEqual(
    parentStartTime,
  );
  expect(noAssignmentItems[0].programItemStartTime).toEqual(
    firstProgramItem.startTime,
  );
  expect(noAssignmentItems[0].lotteriedUntil).toEqual(laterProgramItem.endTime);
});

test("should still tell the losers when the placed spots cannot be read", async () => {
  // Suppressing a rejection needs that read; without it, silence for everyone who lost is a
  // certain harm where a wrong rejection is a rare one
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  vi.mocked(findDirectSignupsByProgramItemIds).mockResolvedValueOnce(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results: [],
    users,
    programItems,
  });

  const [userAfterSave] = unsafelyUnwrap(await findUsers());
  expect(
    userAfterSave.eventLogItems.map((eventLogItem) => eventLogItem.action),
  ).toContain(EventLogAction.NO_ASSIGNMENT);
});

test("should drop a whole group whose program item no longer has room for all of it", async () => {
  const groupCode = "group-that-no-longer-fits";

  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
  await saveUser({ ...mockUser2, groupCode });
  await saveUser(mockUser3);

  // Two spots, one of them taken by somebody the run is not placing, so the group of two has
  // one spot to land in and a group lands in one program item or none
  await saveProgramItems([
    { ...testProgramItem, maxAttendance: 2 },
    { ...testProgramItem2, startTime: testProgramItem.startTime },
  ]);

  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser3.username,
  });
  // Held at the hour the group is being placed at, so a placement would replace it
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser.username,
    directSignupProgramItemId: testProgramItem2.programItemId,
  });

  const results: UserAssignmentResult[] = [mockUser, mockUser2].map((user) => ({
    username: user.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  }));

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // Neither member is placed, rather than one of them taking the single spot
  const signups = unsafelyUnwrap(await findDirectSignups());
  const wonProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(
    wonProgramItemSignup?.userSignups.map((userSignup) => userSignup.username),
  ).toEqual([mockUser3.username]);

  // The spot a dropped member holds is left in place, since nothing was given to replace it
  const heldProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem2.programItemId,
  );
  expect(
    heldProgramItemSignup?.userSignups.map((userSignup) => userSignup.username),
  ).toEqual([mockUser.username]);

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const usersWithNewAssignment = usersAfterSave.filter((user) =>
    user.eventLogItems.some(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    ),
  );
  expect(usersWithNewAssignment).toEqual([]);
});

test("should place a whole group that still has room for all of it", async () => {
  const groupCode = "group-that-fits";

  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
  await saveUser({ ...mockUser2, groupCode });
  await saveUser(mockUser3);

  // One spot more than the case above, so the same group fits
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 3 }]);

  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser3.username,
  });

  const results: UserAssignmentResult[] = [mockUser, mockUser2].map((user) => ({
    username: user.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  }));

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const signups = unsafelyUnwrap(await findDirectSignups());
  const wonProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(
    wonProgramItemSignup?.userSignups.map((userSignup) => userSignup.username),
  ).toEqual(
    expect.arrayContaining([
      mockUser3.username,
      mockUser.username,
      mockUser2.username,
    ]),
  );
});

test("should place a winner whose username names an Object prototype member", async () => {
  // A username is unrestricted input, and one with no sign-ups to look up reads back as an
  // inherited function when the lookup is keyed into a plain object, which then cannot be
  // filtered - after the spots have already been committed
  const username = "constructor";

  await saveUser({ ...mockUser, username });
  await saveUser(mockUser2);
  await saveProgramItems([
    { ...testProgramItem, maxAttendance: 2 },
    { ...testProgramItem2, startTime: testProgramItem.startTime },
  ]);

  // Held by somebody else, so the winner being looked up has nothing of their own
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser2.username,
    directSignupProgramItemId: testProgramItem2.programItemId,
  });

  const results: UserAssignmentResult[] = [
    {
      username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  const signups = unsafelyUnwrap(await findDirectSignups());
  const wonProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(
    wonProgramItemSignup?.userSignups.map((userSignup) => userSignup.username),
  ).toEqual([username]);

  // Somebody else's spot at that hour is not theirs to give up
  const heldProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem2.programItemId,
  );
  expect(
    heldProgramItemSignup?.userSignups.map((userSignup) => userSignup.username),
  ).toEqual([mockUser2.username]);
});

test("should drop a whole group whose room is taken by a spot the write has not freed yet", async () => {
  const groupCode = "group-counted-against-a-held-spot";

  await saveUser(mockUser3);
  await saveUser({ ...mockUser, groupCode, isGroupCreator: true });
  await saveUser({ ...mockUser2, groupCode });

  // Two spots in the program item the group is placed into, one of them held by an attendee
  // being placed elsewhere at the same hour
  await saveProgramItems([
    { ...testProgramItem, maxAttendance: 2 },
    { ...testProgramItem2, startTime: testProgramItem.startTime },
  ]);

  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser3.username,
  });

  const results: UserAssignmentResult[] = [
    {
      username: mockUser3.username,
      assignmentSignup: {
        programItemId: testProgramItem2.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    ...[mockUser, mockUser2].map((user) => ({
      username: user.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    })),
  ];

  const users = unsafelyUnwrap(await findUsers());
  const programItems = unsafelyUnwrap(await findProgramItems());

  await saveAndNotify({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // The held spot is still taken when the spots are written, so there is room for one of the
  // two and the group goes without rather than landing half in
  const signups = unsafelyUnwrap(await findDirectSignups());
  const groupProgramItemSignup = signups.find(
    (signup) => signup.programItemId === testProgramItem.programItemId,
  );
  expect(
    groupProgramItemSignup?.userSignups.map(
      (userSignup) => userSignup.username,
    ),
  ).toEqual([]);

  const usersAfterSave = unsafelyUnwrap(await findUsers());
  const groupMembersPlaced = usersAfterSave.filter(
    (user) =>
      user.groupCode === groupCode &&
      user.eventLogItems.some(
        (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
      ),
  );
  expect(groupMembersPlaced).toEqual([]);
});
