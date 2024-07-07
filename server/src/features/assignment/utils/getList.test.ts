import { expect, test } from "vitest";
import dayjs from "dayjs";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getList } from "server/features/assignment/utils/getList";
import { User, UserGroup } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramType } from "shared/types/models/programItem";

const startTime = "2019-11-23T12:00:00+02:00";
const groupCreatorGroupCode = "123-234-345";

const getUsers = ({
  count,
  noLotterySignups = false,
}: {
  count: number;
  noLotterySignups?: boolean;
}): User[] => {
  const users: User[] = [];

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
      eventLogItems: [],
    };

    if (i === 0) {
      users.push({
        ...defaultUserValues,
        username: "group-creator-with-lottery-signup",
        groupCreatorCode: groupCreatorGroupCode,
        lotterySignups: noLotterySignups
          ? []
          : [
              {
                programItem: testProgramItem,
                priority: 1,
                time: startTime,
                message: "",
              },
            ],
      });
      continue;
    }

    users.push({
      ...defaultUserValues,
      username: `group-member-${i}`,
      groupCreatorCode: "0",
      lotterySignups: [],
    });
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
  const userArray: User[] = getUsers({ count: 1, noLotterySignups: true });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, []);

  expect(list).toEqual({ value: [] });
});

test("should generate assignment list with bonuses for single user without any direct signups", () => {
  const userArray: User[] = getUsers({ count: 1 });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, []);

  expect(list).toEqual({
    value: [
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ],
  });
});

test("should generate assignment list with bonuses for single user without previous direct signups", () => {
  const userArray: User[] = getUsers({ count: 1 });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({ username: "foobar user" }),
  ]);

  expect(list).toEqual({
    value: [
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ],
  });
});

test("should generate assignment list with bonuses for group without previous direct signups", () => {
  const userArray: User[] = getUsers({ count: 2 });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({ username: "foobar user" }),
  ]);

  expect(list).toEqual({
    value: [
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 2,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 2,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 2,
      },
    ],
  });
});

test("should generate assignment list without bonuses for group with previous direct signups", () => {
  const userArray: User[] = getUsers({ count: 2 });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({
      username: userArray[1].username,
    }),
  ]);

  expect(list).toEqual({
    value: [
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 2,
      },
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 2,
      },
      {
        event: testProgramItem.programItemId,
        gain: 1,
        id: groupCreatorGroupCode,
        size: 2,
      },
    ],
  });
});

test("should generate assignment list with bonuses if user has direct signups for different program type", () => {
  const userArray: User[] = getUsers({ count: 1 });
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({
      programType: ProgramType.TOURNAMENT,
      username: userArray[0].username,
    }),
  ]);

  expect(list).toEqual({
    value: [
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
      {
        event: testProgramItem.programItemId,
        gain: 21,
        id: groupCreatorGroupCode,
        size: 1,
      },
    ],
  });
});
