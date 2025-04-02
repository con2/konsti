import { describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getList } from "server/features/assignment/utils/getList";
import { LotterySignup, User, UserGroup } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramType } from "shared/types/models/programItem";
import { config } from "shared/config";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";

const startTime = "2019-11-23T12:00:00+02:00";
const groupCreatorGroupCode = "123-234-345";

const { firstSignupBonus, additionalFirstSignupBonus } = config.server();

const getLotterySignups = (): LotterySignup[] => {
  return [
    {
      programItem: testProgramItem,
      priority: 1,
      time: startTime,
      message: "",
    },
  ];
};

const getPastLotterySignupEvents = ({
  pastFailureLotterySignups,
  pastSuccessLotterySignups,
}: {
  pastFailureLotterySignups: number;
  pastSuccessLotterySignups: number;
}): EventLogItem[] => {
  const eventLogItems: EventLogItem[] = [];
  for (let i = 0; i < pastFailureLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: faker.string.alphanumeric(10),
      action: EventLogAction.NO_ASSIGNMENT,
      isSeen: false,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: dayjs(startTime)
        .subtract(i + 1, "hours")
        .toISOString(),
      createdAt: dayjs(startTime).subtract(1, "hours").toISOString(),
    });
  }

  for (let i = 0; i < pastSuccessLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: faker.string.alphanumeric(10),
      action: EventLogAction.NEW_ASSIGNMENT,
      isSeen: false,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: dayjs(startTime)
        .subtract(i + 1, "hours")
        .toISOString(),
      createdAt: dayjs(startTime).subtract(1, "hours").toISOString(),
    });
  }

  return eventLogItems;
};

const getUsers = ({
  count,
  noLotterySignups = false,
  pastLotterySignupUsers = 0,
  pastFailureLotterySignups = 0,
  pastSuccessLotterySignups = 0,
}: {
  count: number;
  noLotterySignups?: boolean;
  pastLotterySignupUsers?: number;
  pastSuccessLotterySignups?: number;
  pastFailureLotterySignups?: number;
}): User[] => {
  const users: User[] = [];
  let pastLotterySignupUsersCounter = pastLotterySignupUsers;

  for (let i = 0; i < count; i++) {
    const defaultUserValues = {
      kompassiId: 0,
      kompassiUsernameAccepted: false,
      password: "password",
      userGroup: UserGroup.USER,
      serial: `12${i}`,
      groupCode: groupCreatorGroupCode,
      favoriteProgramItemIds: [],
      createdAt: dayjs(startTime).subtract(4, "hours").toISOString(),
    };

    if (i === 0) {
      users.push({
        ...defaultUserValues,
        username: "group-creator-with-lottery-signup",
        groupCreatorCode: groupCreatorGroupCode,
        lotterySignups: noLotterySignups ? [] : getLotterySignups(),
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
              })
            : [],
      });
    } else {
      users.push({
        ...defaultUserValues,
        username: `group-member-${i}`,
        groupCreatorCode: "0",
        lotterySignups: [],
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
              })
            : [],
      });
    }

    pastLotterySignupUsersCounter--;
  }

  return users;
};

const getPreviousDirectSignup = ({
  username,
  programType,
}: {
  username: string;
  programType?: ProgramType;
}): DirectSignupsForProgramItem => {
  return {
    programItem: {
      ...testProgramItem,
      programType: programType ?? testProgramItem.programType,
    },
    userSignups: [
      {
        username,
        priority: 1,
        time: dayjs(startTime).subtract(1, "hours").toISOString(),
        message: "",
      },
    ],
  };
};

test("should return empty array if user has no lottery signups", () => {
  const users = getUsers({ count: 1, noLotterySignups: true });
  const attendeeGroups = [users, users, users];
  const list = getList({
    attendeeGroups,
    startTime,
    directSignups: [],
    lotterySignupProgramItems: [testProgramItem],
  });

  expect(list).toEqual({ value: [] });
});

test("should return as many results as user groups", () => {
  const users = getUsers({ count: 1 });
  const attendeeGroups = [users, users, users];
  const list = getList({
    attendeeGroups,
    startTime,
    directSignups: [],
    lotterySignupProgramItems: [testProgramItem],
  });

  expect(list).toEqual({
    value: [
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
    ],
  });
});

describe("should give first time bonus", () => {
  test("for single user when there are no direct signups", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for single user without previous direct signups", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [getPreviousDirectSignup({ username: "foobar user" })],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for single user with direct signup of different program type", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
        getPreviousDirectSignup({
          programType: ProgramType.TOURNAMENT,
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for single user with direct signup of 'directSignupAlwaysOpenIds' program item", () => {
    vi.spyOn(config, "event").mockReturnValueOnce({
      ...config.event(),
      directSignupAlwaysOpenIds: [testProgramItem.programItemId],
    });

    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for group without previous direct signups", () => {
    const users = getUsers({ count: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [getPreviousDirectSignup({ username: "foobar user" })],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 2,
        },
      ],
    });
  });

  test("for group with half previous direct signups", () => {
    // Group of two, one has previous direct signup
    const users = getUsers({ count: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [getPreviousDirectSignup({ username: users[0].username })],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 2,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 2,
        },
      ],
    });
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
      startTime,
      directSignups: [getPreviousDirectSignup({ username: users[1].username })],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 4,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 4,
        },
      ],
    });
  });
});

describe("should NOT give first time bonus", () => {
  test("for single user with previous direct signup", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for group with less than half previous direct signups", () => {
    // Group of five, three have previous direct signup
    const users = getUsers({ count: 5 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
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

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1,
          id: groupCreatorGroupCode,
          size: 5,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus + additionalFirstSignupBonus,
          id: groupCreatorGroupCode,
          size: 4,
        },
      ],
    });
  });
});

describe("should NOT give additional bonus", () => {
  test("for single user with previous direct signup", () => {
    const users = getUsers({ count: 1, pastLotterySignupUsers: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
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
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for single user without previous lottery signup", () => {
    const users = getUsers({ count: 1 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [
        getPreviousDirectSignup({
          username: users[0].username,
        }),
      ],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1,
          id: groupCreatorGroupCode,
          size: 1,
        },
      ],
    });
  });

  test("for group with less than half previous failed lottery signups", () => {
    const users = getUsers({ count: 5, pastLotterySignupUsers: 2 });
    const attendeeGroups = [users];
    const list = getList({
      attendeeGroups,
      startTime,
      directSignups: [],
      lotterySignupProgramItems: [testProgramItem],
    });

    expect(list).toEqual({
      value: [
        {
          event: testProgramItem.programItemId,
          gain: 1 + firstSignupBonus,
          id: groupCreatorGroupCode,
          size: 5,
        },
      ],
    });
  });
});
