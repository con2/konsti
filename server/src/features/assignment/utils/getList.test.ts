import { addMinutes } from "date-fns";
import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { stubParentStartTime } from "shared/tests/stubParentStartTime";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  assignmentTime,
  getPreviousDirectSignup,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";
import { getList } from "server/features/assignment/utils/getList";
import { getLotteryParticipantDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";
import { ListItem } from "server/types/assignmentTypes";

afterEach(() => {
  vi.resetAllMocks();
});

const { firstSignupBonus, additionalFirstSignupBonus } = config.server();

type GetListParams = Parameters<typeof getList>[0];

const listFor = (
  attendeeGroups: User[][],
  overrides: Partial<GetListParams> = {},
): ListItem[] => {
  return getList({
    attendeeGroups,
    assignmentTime,
    lotteryParticipantDirectSignups: [],
    lotterySignupProgramItems: [testProgramItem],
    allProgramItems: [testProgramItem, testProgramItem2],
    ...overrides,
  });
};

const listItem = (gain: number, size: number): ListItem => {
  return {
    event: testProgramItem.programItemId,
    gain,
    id: groupCreatorGroupCode,
    size,
  };
};

test("should return empty array if user has no lottery sign-ups", () => {
  const users = getUsers({ count: 1, noLotterySignups: true });
  const list = listFor([users, users, users]);

  expect(list).toEqual([]);
});

test("should return as many list items as user groups", () => {
  const users = getUsers({ count: 1 });
  const list = listFor([users, users, users]);

  const expectedItem = listItem(1 + firstSignupBonus, 1);
  expect(list).toEqual([expectedItem, expectedItem, expectedItem]);
});

test("should return list items for program items using parent startTime via 'startTimesByParentIds'", () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  stubParentStartTime(testProgramItem, parentStartTime);

  const users = getUsers({ count: 1 });
  const list = listFor([users, users, users], {
    assignmentTime: parentStartTime,
  });

  const expectedItem = listItem(1 + firstSignupBonus, 1);
  expect(list).toEqual([expectedItem, expectedItem, expectedItem]);
});

// A sign-up naming a program item the run is not allocating - skipped for holding sign-ups,
// or lotteried already - has no event for the assigner to map it to, and one such preference
// makes it reject the whole input
test("leaves out lottery sign-ups for program items not in the run", () => {
  const users = getUsers({ count: 1 });
  const list = listFor([users], {
    lotterySignupProgramItems: [testProgramItem2],
  });

  expect(list).toEqual([]);
});

test("leaves out a batched program item not in the run, whose own start time still matches", () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  stubParentStartTime(testProgramItem, parentStartTime);

  // Without the program item there is no parent to resolve, so an unguarded lookup compares
  // the raw times and keeps a preference the assigner cannot place
  const users = getUsers({ count: 1 });
  const list = listFor([users], {
    assignmentTime: testProgramItem.startTime,
    lotterySignupProgramItems: [],
  });

  expect(list).toEqual([]);
});

// Who holds a previous direct sign-up: a group member by index, or an attendee outside the
// group, whose sign-up must not count against it
type PreviousDirectSignupHolder = number | "outsider";

interface BonusCase {
  case: string;
  users: Parameters<typeof getUsers>[0];
  previousDirectSignupHolders?: PreviousDirectSignupHolder[];
  gain: number;
}

const testBonusCases = (cases: BonusCase[]): void => {
  test.each(cases)(
    "$case",
    ({ users: userOptions, previousDirectSignupHolders = [], gain }) => {
      const users = getUsers(userOptions);
      const list = listFor([users], {
        lotteryParticipantDirectSignups: previousDirectSignupHolders.map(
          (holder) =>
            getPreviousDirectSignup({
              username:
                holder === "outsider" ? "foobar user" : users[holder].username,
            }),
        ),
      });

      expect(list).toEqual([listItem(gain, users.length)]);
    },
  );
};

describe("should give first time bonus", () => {
  testBonusCases([
    {
      // Non-lottery direct sign-ups are filtered earlier so having them is the same as not
      // having previous direct sign-ups
      case: "for single user when there are no direct sign-ups from previous lotteries",
      users: { count: 1 },
      gain: 1 + firstSignupBonus,
    },
    {
      case: "for single user without previous direct sign-ups",
      users: { count: 1 },
      previousDirectSignupHolders: ["outsider"],
      gain: 1 + firstSignupBonus,
    },
    {
      // The program item they were placed in before is gone, so that placement was not
      // theirs to keep and must not cost them the first time bonus
      case: "for single user with NEW_ASSIGNMENT event if program item cancelled",
      users: {
        count: 1,
        pastLotterySignupUsers: 1,
        pastSuccessLotterySignups: 1,
        pastAssignmentProgramItemId: "cancelled-program-item",
      },
      gain: 1 + firstSignupBonus,
    },
    {
      case: "for group without previous direct sign-ups",
      users: { count: 2 },
      previousDirectSignupHolders: ["outsider"],
      gain: 1 + firstSignupBonus,
    },
    {
      case: "for group with half previous direct sign-ups",
      users: { count: 2 },
      previousDirectSignupHolders: [0],
      gain: 1 + firstSignupBonus,
    },
    {
      case: "for group with half NEW_ASSIGNMENT events",
      users: {
        count: 2,
        pastLotterySignupUsers: 1,
        pastSuccessLotterySignups: 1,
      },
      gain: 1 + firstSignupBonus,
    },
    {
      // First group member has NEW_ASSIGNMENT, second group member has direct sign-up
      case: "for group with NEW_ASSIGNMENT event and previous direct sign-up",
      users: {
        count: 4,
        pastLotterySignupUsers: 1,
        pastSuccessLotterySignups: 1,
      },
      previousDirectSignupHolders: [1],
      gain: 1 + firstSignupBonus,
    },
    {
      case: "for group with NEW_ASSIGNMENT events if program item cancelled",
      users: {
        count: 4,
        pastLotterySignupUsers: 3,
        pastSuccessLotterySignups: 1,
        pastAssignmentProgramItemId: "cancelled-program-item",
      },
      gain: 1 + firstSignupBonus,
    },
  ]);

  test("for single user with previous direct sign-up to a 'directSignupAlwaysOpenIds' program item", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [testProgramItem2.programItemId],
    });

    const users = getUsers({ count: 1 });
    // Always-open direct sign-ups don't take part in lotteries, so they must not use up the first time bonus
    const list = listFor([users], {
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
    });

    expect(list).toEqual([listItem(1 + firstSignupBonus, 1)]);
  });

  test("for single user with previous direct sign-up to a pre-convention-week program item", () => {
    const preConventionWeekProgramItem = {
      ...testProgramItem2,
      tags: [Tag.PRE_CONVENTION_WEEK],
    };

    const users = getUsers({ count: 1 });
    // Pre-convention-week items are always open for direct sign-up, so their sign-ups must not use up the first time bonus
    const list = listFor([users], {
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
    });

    expect(list).toEqual([listItem(1 + firstSignupBonus, 1)]);
  });
});

describe("should NOT give first time bonus", () => {
  testBonusCases([
    {
      case: "for single user with previous direct sign-up",
      users: { count: 1 },
      previousDirectSignupHolders: [0],
      gain: 1,
    },
    {
      case: "for group with more than half previous direct sign-ups",
      users: { count: 5 },
      previousDirectSignupHolders: [0, 1, 2],
      gain: 1,
    },
  ]);
});

describe("should give additional bonus", () => {
  testBonusCases([
    {
      case: "for single user with previous failed lottery sign-ups",
      users: {
        count: 1,
        pastLotterySignupUsers: 1,
        pastFailureLotterySignups: 1,
      },
      gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
    },
    {
      case: "for single user with multiple failed lottery sign-ups",
      users: {
        count: 1,
        pastLotterySignupUsers: 1,
        pastFailureLotterySignups: 4,
      },
      gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
    },
    {
      case: "for group with half previous failed lottery sign-ups",
      users: {
        count: 4,
        pastLotterySignupUsers: 2,
        pastFailureLotterySignups: 1,
      },
      gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
    },
  ]);
});

describe("should NOT give additional bonus", () => {
  testBonusCases([
    {
      // The failed lottery sign-up would otherwise grant the additional bonus, but the
      // previous direct sign-up blocks it
      case: "for single user with previous direct sign-up",
      users: {
        count: 1,
        pastLotterySignupUsers: 1,
        pastFailureLotterySignups: 1,
      },
      previousDirectSignupHolders: [0],
      gain: 1,
    },
    {
      case: "for single user with NEW_ASSIGNMENT event",
      users: {
        count: 1,
        pastLotterySignupUsers: 1,
        pastFailureLotterySignups: 1,
        pastSuccessLotterySignups: 1,
      },
      gain: 1,
    },
    {
      case: "for single user without previous lottery sign-up",
      users: { count: 1 },
      previousDirectSignupHolders: [0],
      gain: 1,
    },
    {
      // Two of five members have a failed lottery sign-up, below the 0.5 threshold
      case: "for group with less than half previous failed lottery sign-ups",
      users: {
        count: 5,
        pastLotterySignupUsers: 2,
        pastFailureLotterySignups: 1,
      },
      gain: 1 + firstSignupBonus,
    },
  ]);
});

// A batched run's own time is the parent's, while the sign-ups it wrote record the hour each
// attendee turns up - so "is this from the run happening now" has to know the hours the run
// covers, not just the time it is keyed on
test("treats this run's own win as current for a batched program item", () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    -30,
  ).toISOString();

  stubParentStartTime(testProgramItem, parentStartTime);

  const users = getUsers({ count: 1 });
  const list = listFor([users], {
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
  });

  // Recognised as this run's own, so it does not spend the first time bonus
  expect(list).toEqual([listItem(1 + firstSignupBonus, 1)]);
});
