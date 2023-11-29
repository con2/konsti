import { expect, test } from "vitest";
import { testGame } from "shared/tests/testGame";
import { getList } from "server/features/player-assignment/utils/getList";
import { User, UserGroup } from "shared/types/models/user";
import { Signup } from "server/features/signup/signupTypes";
import { ProgramType } from "shared/types/models/game";

const groupCreatorUser: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "123",
  groupCode: "123-234-345",
  groupCreatorCode: "123-234-345",
  favoritedGames: [],
  signedGames: [
    {
      gameDetails: testGame,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
  createdAt: "2019-11-23T12:00:00+02:00",
  eventLogItems: [],
};

const groupMember1: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username 2",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "456",
  groupCode: "123-234-345",
  groupCreatorCode: "0",
  favoritedGames: [],
  signedGames: [],
  createdAt: "2019-11-23T12:00:00+02:00",
  eventLogItems: [],
};

const groupMember2: User = {
  kompassiId: 0,
  kompassiUsernameAccepted: false,
  username: "username 3",
  password: "password",
  userGroup: UserGroup.USER,
  serial: "789",
  groupCode: "123-234-345",
  groupCreatorCode: "0",
  favoritedGames: [],
  signedGames: [],
  createdAt: "2019-11-23T12:00:00+02:00",
  eventLogItems: [],
};

const previousMatchingSignup: Signup = {
  game: testGame,
  userSignups: [
    {
      username: groupMember2.username,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
};

const previousNotMatchingSignup: Signup = {
  game: testGame,
  userSignups: [
    {
      username: "test name",
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
};

const previousMatchingSignupWithWrongType: Signup = {
  game: { ...testGame, programType: ProgramType.TOURNAMENT },
  userSignups: [
    {
      username: groupCreatorUser.username,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
};

const startTime = "2019-11-23T12:00:00+02:00";

test("should return empty array if user has no signed games", () => {
  const userArray: User[] = [groupMember2];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, []);

  expect(list).toEqual({ value: [] });
});

test("should generate assignment list with bonuses for single user when signups is empty", () => {
  const userArray: User[] = [groupCreatorUser];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, []);

  expect(list).toEqual({
    value: [
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
    ],
  });
});

test("should generate assignment list with bonuses for single user", () => {
  const userArray: User[] = [groupCreatorUser];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, [previousNotMatchingSignup]);

  expect(list).toEqual({
    value: [
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
    ],
  });
});

test("should generate assignment list with bonuses for group", () => {
  const userArray: User[] = [groupCreatorUser, groupMember1];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, [previousNotMatchingSignup]);

  expect(list).toEqual({
    value: [
      { event: "p2106", gain: 21, id: "123-234-345", size: 2 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 2 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 2 },
    ],
  });
});

test("should generate assignment list without bonuses for group", () => {
  const userArray: User[] = [groupCreatorUser, groupMember2];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, [previousMatchingSignup]);

  expect(list).toEqual({
    value: [
      { event: "p2106", gain: 1, id: "123-234-345", size: 2 },
      { event: "p2106", gain: 1, id: "123-234-345", size: 2 },
      { event: "p2106", gain: 1, id: "123-234-345", size: 2 },
    ],
  });
});

test("should generate assignment list with bonuses if user has signups for different program type", () => {
  const userArray: User[] = [groupCreatorUser];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startTime, [
    previousMatchingSignupWithWrongType,
  ]);

  expect(list).toEqual({
    value: [
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
      { event: "p2106", gain: 21, id: "123-234-345", size: 1 },
    ],
  });
});
