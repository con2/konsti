import { addMinutes } from "date-fns";
import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import {
  assignmentTime,
  getPreviousDirectSignup,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";
import { getList } from "server/features/assignment/utils/getList";
import { getLotteryParticipantDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";

afterEach(() => {
  vi.resetAllMocks();
});

const { firstSignupBonus, additionalFirstSignupBonus } = config.server();

test("should return empty array if user has no lottery signups", () => {
  const users = getUsers({ count: 1, noLotterySignups: true });
  const attendeeGroups = [users, users, users];
  const list = getList({
    attendeeGroups,
    assignmentTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [testProgramItem],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  expect(list).toEqual([]);
});

test("should return as many list items as user groups", () => {
  const users = getUsers({ count: 1 });
  const attendeeGroups = [users, users, users];
  const list = getList({
    attendeeGroups,
    assignmentTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [testProgramItem],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  expect(list).toEqual([
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
  ]);
});

test("should return list items for program items using parent startTime via 'startTimesByParentIds'", () => {
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

  const users = getUsers({ count: 1 });
  const attendeeGroups = [users, users, users];
  const list = getList({
    attendeeGroups,
    assignmentTime: parentStartTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [testProgramItem],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  expect(list).toEqual([
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
  ]);
});

// A sign-up naming a program item the run is not allocating - skipped for holding sign-ups,
// or lotteried already - has no event for the assigner to map it to, and one such preference
// makes it reject the whole input
test("leaves out lottery signups for program items not in the run", () => {
  const users = getUsers({ count: 1 });

  const list = getList({
    attendeeGroups: [users],
    assignmentTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [testProgramItem2],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  expect(list).toEqual([]);
});

test("leaves out a batched program item not in the run, whose own start time still matches", () => {
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

  // Without the program item there is no parent to resolve, so an unguarded lookup compares
  // the raw times and keeps a preference the assigner cannot place
  const users = getUsers({ count: 1 });

  const list = getList({
    attendeeGroups: [users],
    assignmentTime: testProgramItem.startTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  expect(list).toEqual([]);
});

describe("should give first time bonus", () => {
  // Non-lottery direct sign-ups are filtered earlier so having them is the same as not having previous direct sign-ups
  test("for single user when there are no direct signups from previous lotteries", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user without previous direct signups", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({ username: "foobar user" }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user with previous direct signup to a 'directSignupAlwaysOpenIds' program item", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [testProgramItem2.programItemId],
    });

    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    // Always-open direct sign-ups don't take part in lotteries, so they must not use up the first time bonus
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: getLotteryParticipantDirectSignups(
        [
          getPreviousDirectSignup({
            username: users[0].username,
            programItemId: testProgramItem2.programItemId,
            priority: DIRECT_SIGNUP_PRIORITY,
          }),
        ],
        [testProgramItem, testProgramItem2],
      ),
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user with previous direct signup to a pre-convention-week program item", () => {
    const preConventionWeekProgramItem = {
      ...testProgramItem2,
      tags: [Tag.PRE_CONVENTION_WEEK],
    };

    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    // Pre-convention-week items are always open for direct sign-up, so their sign-ups must not use up the first time bonus
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: getLotteryParticipantDirectSignups(
        [
          getPreviousDirectSignup({
            username: users[0].username,
            programItemId: preConventionWeekProgramItem.programItemId,
            priority: DIRECT_SIGNUP_PRIORITY,
          }),
        ],
        [testProgramItem, preConventionWeekProgramItem],
      ),
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user with NEW_ASSIGNMENT event if program item cancelled", () => {
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastSuccessLotterySignups: 1,
      // The program item they were placed in before is gone, so that placement was not
      // theirs to keep and must not cost them the first time bonus
      pastAssignmentProgramItemId: "cancelled-program-item",
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for group without previous direct signups", () => {
    const users = getUsers({ count: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({ username: "foobar user" }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 2,
      },
    ]);
  });

  test("for group with half previous direct signups", () => {
    // Group of two, one has previous direct sign-up
    const users = getUsers({ count: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({ username: users[0].username }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 2,
      },
    ]);
  });

  test("for group with half NEW_ASSIGNMENT events", () => {
    const users = getUsers({
      count: 2,
      pastLotterySignupUsers: 1,
      pastSuccessLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 2,
      },
    ]);
  });

  test("for group with NEW_ASSIGNMENT event and previous direct signup", () => {
    // First group member has NEW_ASSIGNMENT, second group member has direct sign-up
    const users = getUsers({
      count: 4,
      pastLotterySignupUsers: 1,
      pastSuccessLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({ username: users[1].username }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 4,
      },
    ]);
  });

  test("for group with NEW_ASSIGNMENT events if program item cancelled", () => {
    const users = getUsers({
      count: 4,
      pastLotterySignupUsers: 3,
      pastSuccessLotterySignups: 1,
      pastAssignmentProgramItemId: "cancelled-program-item",
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 4,
      },
    ]);
  });
});

describe("should NOT give first time bonus", () => {
  test("for single user with previous direct signup", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for group with more than half previous direct signups", () => {
    // Group of five, three have previous direct sign-up
    const users = getUsers({ count: 5 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
        getPreviousDirectSignup({
          username: users[1].username,
        }),
        getPreviousDirectSignup({
          username: users[2].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 5,
      },
    ]);
  });
});

describe("should give additional bonus", () => {
  test("for single user with previous failed lottery signups", () => {
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastFailureLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user with multiple failed lottery signups", () => {
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastFailureLotterySignups: 4,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for group with half previous failed lottery signups", () => {
    const users = getUsers({
      count: 4,
      pastLotterySignupUsers: 2,
      pastFailureLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
        id: groupCreatorGroupCode,
        size: 4,
      },
    ]);
  });
});

describe("should NOT give additional bonus", () => {
  test("for single user with previous direct signup", () => {
    // The failed lottery sign-up would otherwise grant the additional bonus,
    // but the previous direct sign-up blocks it
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastFailureLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user with NEW_ASSIGNMENT event", () => {
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastFailureLotterySignups: 1,
      pastSuccessLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for single user without previous lottery signup", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ]);
  });

  test("for group with less than half previous failed lottery signups", () => {
    // Two of five members have a failed lottery sign-up -> below the 0.5 threshold
    const users = getUsers({
      count: 5,
      pastLotterySignupUsers: 2,
      pastFailureLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
      allProgramItems: [testProgramItem, testProgramItem2],
    });

    expect(list).toEqual([
      {
        event: testProgramItem.programItemId,
        gain: 1 + firstSignupBonus,
        id: groupCreatorGroupCode,
        size: 5,
      },
    ]);
  });
});

// A batched run's own time is the parent's, while the sign-ups it wrote record the hour each
// attendee turns up - so "is this from the run happening now" has to know the hours the run
// covers, not just the time it is keyed on
test("treats this run's own win as current for a batched program item", () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    -30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const users = getUsers({ count: 1 });

  const list = getList({
    attendeeGroups: [users],
    assignmentTime: parentStartTime,
    // The spot this very run just gave them, recorded against the program item's own hour
    lotteryParticipantDirectSignups: getLotteryParticipantDirectSignups(
      [
        {
          programItemId: testProgramItem.programItemId,
          count: 1,
          userSignups: [
            {
              username: users[0].username,
              priority: 1,
              signedToStartTime: testProgramItem.startTime,
              signupTime: testProgramItem.startTime,
              message: "",
            },
          ],
        },
      ],
      [testProgramItem],
    ),
    lotterySignupProgramItems: [testProgramItem],
    allProgramItems: [testProgramItem, testProgramItem2],
  });

  // Recognised as this run's own, so it does not spend the first time bonus
  expect(list).toEqual([
    {
      event: testProgramItem.programItemId,
      gain: 1 + firstSignupBonus,
      id: groupCreatorGroupCode,
      size: 1,
    },
  ]);
});
