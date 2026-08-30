import { subHours } from "date-fns";
import { expect, test } from "vitest";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { State } from "shared/types/models/programItem";
import { getUsers } from "server/features/assignment/utils/assignmentTestUtils";
import {
  getAssignmentBonus,
  getAssignmentBonusContext,
} from "server/features/assignment/utils/getAssignmentBonus";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

const assignmentTime = testProgramItem.startTime;

test("should give the first-time bonus to a member with no previous direct sign-ups or assignments", () => {
  const [user] = getUsers({ count: 1 });

  const bonus = getAssignmentBonus(
    [user],
    [],
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should still give the first-time bonus when a member's only direct sign-up is this lottery's own win", () => {
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a first-come-first-served direct sign-up at the current start time", () => {
  const [user] = getUsers({ count: 1 });

  // A priority-0 (first-come-first-served) direct sign-up is a real sign-up the user made, not
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a genuine previous direct sign-up at an earlier start time", () => {
  const [user] = getUsers({ count: 1 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();

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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(0);
});

test("should add the additional first-time bonus for a member with a previous failed lottery sign-up", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  // No previous direct sign-up -> first-time bonus, plus a previous failed lottery -> additional bonus
  expect(bonus).toEqual(
    config.server().firstSignupBonus +
      config.server().additionalFirstSignupBonus,
  );
});

test("should still give the first-time bonus when exactly half of the group has a previous direct sign-up", () => {
  const users = getUsers({ count: 2 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should give no bonus when more than half of the group has a previous direct sign-up", () => {
  const users = getUsers({ count: 2 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  // The NO_ASSIGNMENT is this run's own result (as on a re-run) -> first-time bonus only
  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for a member previously assigned to a moved item now back in the lottery", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
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
    getAssignmentBonusContext([testProgramItem], assignmentTime),
  );

  expect(bonus).toEqual(0);
});

test("should strip the first-time bonus for a previous assignment to a program item outside this run", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NEW_ASSIGNMENT,
        isSeen: false,
        programItemId: testProgramItem2.programItemId,
        programItemStartTime: earlierStartTime,
        createdAt: earlierStartTime,
      },
    ],
  };

  // The earlier assignment was to another start time, so this run never sees its program item
  const bonus = getAssignmentBonus(
    [user],
    [],
    getAssignmentBonusContext(
      [testProgramItem, testProgramItem2],
      assignmentTime,
    ),
  );

  expect(bonus).toEqual(0);
});

test("should keep the first-time bonus when the previously assigned program item was cancelled", () => {
  const [baseUser] = getUsers({ count: 1 });
  const earlierStartTime = subHours(new Date(assignmentTime), 2).toISOString();
  const user = {
    ...baseUser,
    eventLogItems: [
      {
        eventLogItemId: "event-log-item-id",
        action: EventLogAction.NEW_ASSIGNMENT,
        isSeen: false,
        programItemId: testProgramItem2.programItemId,
        programItemStartTime: earlierStartTime,
        createdAt: earlierStartTime,
      },
    ],
  };

  const bonus = getAssignmentBonus(
    [user],
    [],
    getAssignmentBonusContext(
      [testProgramItem, { ...testProgramItem2, state: State.CANCELLED }],
      assignmentTime,
    ),
  );

  // They never got to attend it, so the placement was not theirs to spend
  expect(bonus).toEqual(config.server().firstSignupBonus);
});

test("should strip the first-time bonus for another lottery's win at one of this run's hours", () => {
  const [user] = getUsers({ count: 1 });

  // A win in a program item this run does not decide, recorded at the same hour. Two lotteries
  // can cover one hour, so the hour alone cannot say whose result this was
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem2.programItemId,
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
    getAssignmentBonusContext(
      [testProgramItem, testProgramItem2],
      assignmentTime,
    ),
  );

  expect(bonus).toEqual(0);
});
