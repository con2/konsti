import { testGame, testGame2 } from "shared/tests/testGame";
import { NewUserData } from "server/typings/user.typings";
import { UserSignup } from "server/typings/result.typings";
import { UserGroup } from "shared/typings/models/user";
import { PostEnteredGameParameters } from "shared/typings/api/signup";

export const mockUser: NewUserData = {
  username: "Test User",
  passwordHash: "$2a$10$RfH4QV71FPDta0wWfCwFreyAWJIZSTB7Rzmn8atwRldJWANuDDIpe", // Hash for password 'password'
  userGroup: UserGroup.USER,
  serial: "1234ABCD",
  groupCode: "0",
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockUser2: NewUserData = {
  username: "Test User 2",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "1234ABCD",
  groupCode: "0",
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockUser3: NewUserData = {
  username: "Test User 3",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "jhertyee",
  groupCode: "0",
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockUser4: NewUserData = {
  username: "Test User 4",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "urtyjjjtyy",
  groupCode: "0",
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockUser5: NewUserData = {
  username: "Test User 5",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "ootehhjjj",
  groupCode: "0",
  favoritedGames: [],
  signedGames: [],
  enteredGames: [],
};

export const mockSignup: UserSignup = {
  username: "Test User",
  signedGames: [
    {
      gameDetails: testGame,
      priority: 1,
      time: testGame.startTime,
      message: "",
    },
    {
      gameDetails: testGame2,
      priority: 1,
      time: testGame2.startTime,
      message: "",
    },
  ],
};

export const mockPostEnteredGameRequest: PostEnteredGameParameters = {
  username: mockUser.username,
  enteredGameId: testGame.gameId,
  startTime: testGame.startTime,
  message: "",
};

export const mockPostEnteredGameRequest2: PostEnteredGameParameters = {
  username: mockUser.username,
  enteredGameId: testGame2.gameId,
  startTime: testGame2.startTime,
  message: "",
};
