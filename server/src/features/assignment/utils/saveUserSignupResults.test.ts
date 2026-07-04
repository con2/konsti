import { afterEach, beforeEach, expect, test, vi } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
  NotificationTaskType,
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
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import {
  findDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { EmailSender } from "server/features/notifications/email";
import { config } from "shared/config";
import { EmailMessage } from "server/features/notifications/senderCommon";

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
  const expectedRejectedBody = `Hei ${mockUser2.username}!
Et valitettavasti päässyt arvonnassa yhteenkään ohjelmaan johon ilmoittauduit.

Hi Test User 2!
Unfortunately you did not get spot in the lottery sign-up.

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
  // Only two seats, but four assignment results are passed -> two signups dropped
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

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // Only two signups fit, the other two are dropped
  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);

  const usersAfterSave = unsafelyUnwrap(await findUsers());

  // The two users whose signups were saved get a NEW_ASSIGNMENT message
  const usersWithNewAssignment = usersAfterSave.filter((user) =>
    user.eventLogItems.some(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    ),
  );
  expect(usersWithNewAssignment).toHaveLength(2);

  // The two users whose signups were dropped get a NO_ASSIGNMENT message instead of silence
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

  // Always-open signups survive the pre-assignment cleanup, so the user keeps both existing
  // direct signups at the assignment start time going into conflict resolution
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

  // Two existing direct signups for the same start time
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

  await saveUserSignupResults({
    assignmentTime: testProgramItem.startTime,
    results,
    users,
    programItems,
  });

  // Both prior same-time signups must be removed, leaving only the assignment result
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

  await saveUserSignupResults({
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

  await saveUserSignupResults({
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
