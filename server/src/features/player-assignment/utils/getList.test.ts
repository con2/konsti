import { testGame } from "shared/tests/testGame";
import { getList } from "server/features/player-assignment/utils/getList";
import { User, UserGroup } from "shared/typings/models/user";
import { Signup } from "server/features/signup/signup.typings";

const user: User = {
  username: "username",
  password: "password",
  userGroup: "user" as UserGroup,
  serial: "123",
  groupCode: "123",
  favoritedGames: [],
  signedGames: [
    {
      gameDetails: testGame,
      priority: 1,
      time: "2019-11-23T12:00:00+02:00",
      message: "",
    },
  ],
  createdAt: null,
};

const user2: User = {
  username: "username 2",
  password: "password",
  userGroup: "user" as UserGroup,
  serial: "456",
  groupCode: "123",
  favoritedGames: [],
  signedGames: [],
  createdAt: null,
};

const user3: User = {
  username: "username 3",
  password: "password",
  userGroup: "user" as UserGroup,
  serial: "456",
  groupCode: "123",
  favoritedGames: [],
  signedGames: [],
  createdAt: null,
};

const previousMatchingSignup: Signup = {
  game: testGame,
  userSignups: [
    {
      username: user3.username,
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

const startingTime = "2019-11-23T12:00:00+02:00";

test("should generate assignment list with bonuses for single user when signups is empty", () => {
  const userArray: User[] = [user];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime, []);

  expect(list).toEqual([
    { event: "p2106", gain: 21, id: "123", size: 1 },
    { event: "p2106", gain: 21, id: "123", size: 1 },
    { event: "p2106", gain: 21, id: "123", size: 1 },
  ]);
});

test("should generate assignment list with bonuses for single user", () => {
  const userArray: User[] = [user];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime, [previousNotMatchingSignup]);

  expect(list).toEqual([
    { event: "p2106", gain: 21, id: "123", size: 1 },
    { event: "p2106", gain: 21, id: "123", size: 1 },
    { event: "p2106", gain: 21, id: "123", size: 1 },
  ]);
});

test("should generate assignment list with bonuses for group", () => {
  const userArray: User[] = [user, user2];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime, [previousNotMatchingSignup]);

  expect(list).toEqual([
    { event: "p2106", gain: 21, id: "123", size: 2 },
    { event: "p2106", gain: 21, id: "123", size: 2 },
    { event: "p2106", gain: 21, id: "123", size: 2 },
  ]);
});

test("should generate assignment list without bonuses for group", () => {
  const userArray: User[] = [user, user3];
  const playerGroups: readonly User[][] = [userArray, userArray, userArray];
  const list = getList(playerGroups, startingTime, [previousMatchingSignup]);

  expect(list).toEqual([
    { event: "p2106", gain: 1, id: "123", size: 2 },
    { event: "p2106", gain: 1, id: "123", size: 2 },
    { event: "p2106", gain: 1, id: "123", size: 2 },
  ]);
});
