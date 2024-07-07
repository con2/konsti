import { expect, test } from "vitest";
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

const previousSignup: DirectSignupsForProgramItem = {
  programItem: testProgramItem,
  userSignups: [
    {
      username: groupMemberWithoutLotterySignups2.username,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
};

const otherUserPreviousSignup: DirectSignupsForProgramItem = {
  programItem: testProgramItem,
  userSignups: [
    {
      username: "test name",
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
};

const previousSignupWithWrongType: DirectSignupsForProgramItem = {
  programItem: { ...testProgramItem, programType: ProgramType.TOURNAMENT },
  userSignups: [
    {
      username: groupCreatorWithLotterySignups.username,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
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
  const list = getList(attendeeGroups, startTime, [otherUserPreviousSignup]);

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
  const list = getList(attendeeGroups, startTime, [otherUserPreviousSignup]);

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
  const list = getList(attendeeGroups, startTime, [previousSignup]);

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
    previousSignupWithWrongType,
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
