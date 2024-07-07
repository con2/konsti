import { expect, test } from "vitest";
import dayjs from "dayjs";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getList } from "server/features/assignment/utils/getList";
import { User, UserGroup } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramType } from "shared/types/models/programItem";

const startTime = "2019-11-23T12:00:00+02:00";
const groupCreatorGroupCode = "123-234-345";

const groupCreatorWithLotterySignups: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "123",
  groupCode: groupCreatorGroupCode,
  groupCreatorCode: groupCreatorGroupCode,
  favoriteProgramItemIds: [],
  lotterySignups: [
    {
      programItem: testProgramItem,
      priority: 1,
      time: startTime,
      message: "",
    },
  ],
  createdAt: startTime,
  eventLogItems: [],
};

const groupMemberWithoutLotterySignups1: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username 2",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "456",
  groupCode: groupCreatorGroupCode,
  groupCreatorCode: "0",
  favoriteProgramItemIds: [],
  lotterySignups: [],
  createdAt: startTime,
  eventLogItems: [],
};

const groupMemberWithoutLotterySignups2: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username 3",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "789",
  groupCode: groupCreatorGroupCode,
  groupCreatorCode: "0",
  favoriteProgramItemIds: [],
  lotterySignups: [],
  createdAt: startTime,
  eventLogItems: [],
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
  const userArray: User[] = [groupMemberWithoutLotterySignups2];
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, []);

  expect(list).toEqual({ value: [] });
});

test("should generate assignment list with bonuses for single user without any direct signups", () => {
  const userArray: User[] = [groupCreatorWithLotterySignups];
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
  const userArray: User[] = [groupCreatorWithLotterySignups];
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
  const userArray: User[] = [
    groupCreatorWithLotterySignups,
    groupMemberWithoutLotterySignups1,
  ];
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
  const userArray: User[] = [
    groupCreatorWithLotterySignups,
    groupMemberWithoutLotterySignups2,
  ];
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({
      username: groupMemberWithoutLotterySignups2.username,
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
  const userArray: User[] = [groupCreatorWithLotterySignups];
  const attendeeGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(attendeeGroups, startTime, [
    getPreviousDirectSignup({
      programType: ProgramType.TOURNAMENT,
      username: groupCreatorWithLotterySignups.username,
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
