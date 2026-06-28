import { expect, test } from "vitest";
import dayjs from "dayjs";
import { getAssignmentBonus } from "server/features/assignment/utils/getAssignmentBonus";
import { getUsers } from "server/features/assignment/utils/assignmentTestUtils";
import { testProgramItem } from "shared/tests/testProgramItem";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { EventLogAction } from "shared/types/models/eventLog";

const assignmentTime = testProgramItem.startTime;

test("should give the first-time bonus to a member with no previous signups or assignments", () => {
  const [user] = getUsers({ count: 1 });

  const bonus = getAssignmentBonus(
    [user],
    [],
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should still give the first-time bonus when a member's only direct signup is this lottery's own win", () => {
  const [user] = getUsers({ count: 1 });

  // A lottery win (priority > 0) at the current assignment time, i.e. this lottery's own
  // result on a re-run — it must not strip the first-time bonus
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 1,
      userSignups: [
        {
          username: user.username,
          priority: 1,
          signedToStartTime: assignmentTime,
          signupTime: assignmentTime,
          message: "",
        },
      ],
    },
  ];

  const bonus = getAssignmentBonus(
    [user],
    directSignups,
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a first-come-first-served direct signup at the current start time", () => {
  const [user] = getUsers({ count: 1 });

  // A priority-0 (first-come-first-served) direct signup is a real signup the user made, not
  // this lottery's output, so it should still count as "previous" even at the current time
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 1,
      userSignups: [
        {
          username: user.username,
          priority: DIRECT_SIGNUP_PRIORITY,
          signedToStartTime: assignmentTime,
          signupTime: assignmentTime,
          message: "",
        },
      ],
    },
  ];

  const bonus = getAssignmentBonus(
    [user],
    directSignups,
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(0);
});

test("should still give the first-time bonus when a member's only NEW_ASSIGNMENT is from this assignment's own run", () => {
  const [baseUser] = getUsers({ count: 1 });
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NEW_ASSIGNMENT,
        isSeen: false,
        programItemId: testProgramItem.programItemId,
        programItemStartTime: assignmentTime,
        createdAt: assignmentTime,
      },
    ],
  };

  const bonus = getAssignmentBonus(
    [user],
    [],
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a genuine previous direct signup at an earlier start time", () => {
  const [user] = getUsers({ count: 1 });
  const earlierStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();

  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 1,
      userSignups: [
        {
          username: user.username,
          priority: DIRECT_SIGNUP_PRIORITY,
          signedToStartTime: earlierStartTime,
          signupTime: earlierStartTime,
          message: "",
        },
      ],
    },
  ];

  const bonus = getAssignmentBonus(
    [user],
    directSignups,
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(0);
});

test("should add the additional first-time bonus for a member with a previous failed lottery signup", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NO_ASSIGNMENT,
        isSeen: false,
        programItemId: "",
        programItemStartTime: earlierStartTime,
        createdAt: earlierStartTime,
      },
    ],
  };

  const bonus = getAssignmentBonus(
    [user],
    [],
    [testProgramItem],
    assignmentTime,
  );

  // No previous direct signup -> first-time bonus, plus a previous failed lottery -> additional bonus
  expect(bonus).toEqual(
    config.server().firstSignupBonus +
      config.server().additionalFirstSignupBonus,
  );
});

test("should still give the first-time bonus when exactly half of the group has a previous signup", () => {
  const users = getUsers({ count: 2 });
  const earlierStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 1,
      userSignups: [
        {
          username: users[0].username,
          priority: DIRECT_SIGNUP_PRIORITY,
          signedToStartTime: earlierStartTime,
          signupTime: earlierStartTime,
          message: "",
        },
      ],
    },
  ];

  const bonus = getAssignmentBonus(
    users,
    directSignups,
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should give no bonus when more than half of the group has a previous signup", () => {
  const users = getUsers({ count: 2 });
  const earlierStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 2,
      userSignups: users.map((user) => ({
        username: user.username,
        priority: DIRECT_SIGNUP_PRIORITY,
        signedToStartTime: earlierStartTime,
        signupTime: earlierStartTime,
        message: "",
      })),
    },
  ];

  const bonus = getAssignmentBonus(
    users,
    directSignups,
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(0);
});

test("should not add the additional first-time bonus for a NO_ASSIGNMENT from this assignment's own run", () => {
  const [baseUser] = getUsers({ count: 1 });
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NO_ASSIGNMENT,
        isSeen: false,
        programItemId: "",
        programItemStartTime: assignmentTime,
        createdAt: assignmentTime,
      },
    ],
  };

  const bonus = getAssignmentBonus(
    [user],
    [],
    [testProgramItem],
    assignmentTime,
  );

  // The NO_ASSIGNMENT is this run's own result (as on a re-run) -> first-time bonus only
  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a member previously assigned to a moved item now back in the lottery", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NEW_ASSIGNMENT,
        isSeen: false,
        programItemId: testProgramItem.programItemId,
        programItemStartTime: earlierStartTime,
        createdAt: earlierStartTime,
      },
    ],
  };

  const bonus = getAssignmentBonus(
    [user],
    [],
    [testProgramItem],
    assignmentTime,
  );

  expect(bonus).toEqual(0);
});
