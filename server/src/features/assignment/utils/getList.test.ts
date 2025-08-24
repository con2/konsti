import { afterEach, describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getList } from "server/features/assignment/utils/getList";
import { config } from "shared/config";
import {
  assignmentTime,
  getPreviousDirectSignup,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";

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
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

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

describe("should give first time bonus", () => {
  // Non-lottery direct signups are filtered earlier so having them is the same as not having previous direct signups
  test("for single user when there are no direct signups from previous lotteries", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
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

  test("for single user with NEW_ASSIGNMENT event if program item canceled", () => {
    const users = getUsers({
      count: 1,
      pastLotterySignupUsers: 1,
      pastSuccessLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [], // Empty array = canceled
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
    // Group of two, one has previous direct signup
    const users = getUsers({ count: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [
        getPreviousDirectSignup({ username: users[0].username }),
      ],
      lotterySignupProgramItems: [testProgramItem],
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
    // First group member has NEW_ASSIGNMENT, second group member has direct signup
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

  test("for group with NEW_ASSIGNMENT events if program item canceled", () => {
    const users = getUsers({
      count: 4,
      pastLotterySignupUsers: 3,
      pastSuccessLotterySignups: 1,
    });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [],
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

  test("for group with less than half previous direct signups", () => {
    // Group of five, three have previous direct signup
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
    const users = getUsers({ count: 1, pastLotterySignupUsers: 1 });
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
    const users = getUsers({ count: 5, pastLotterySignupUsers: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      assignmentTime,
      lotteryParticipantDirectSignups: [],
      lotterySignupProgramItems: [testProgramItem],
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
