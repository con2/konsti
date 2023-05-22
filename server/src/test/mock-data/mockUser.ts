import { testGame, testGame2 } from "shared/tests/testGame";
import { NewUser } from "server/typings/user.typings";
import { SelectedGame, UserGroup } from "shared/typings/models/user";
import { PostEnteredGameRequest } from "shared/typings/api/myGames";

export const mockUser: NewUser = {
  username: "Test User",
  passwordHash: "$2a$10$RfH4QV71FPDta0wWfCwFreyAWJIZSTB7Rzmn8atwRldJWANuDDIpe", // Hash for password 'password'
  userGroup: UserGroup.USER,
  serial: "1234ABCD",
  groupCode: "0",
};

export const mockUser2: NewUser = {
  username: "Test User 2",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "5678IDJL",
  groupCode: "0",
};

export const mockUser3: NewUser = {
  username: "Test User 3",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "jhertyee",
  groupCode: "0",
};

export const mockUser4: NewUser = {
  username: "Test User 4",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "urtyjjjtyy",
  groupCode: "0",
};

export const mockUser5: NewUser = {
  username: "Test User 5",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "ootehhjjj",
  groupCode: "0",
};

export const mockSignedGames: readonly SelectedGame[] = [
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
];

export const mockPostEnteredGameRequest: PostEnteredGameRequest = {
  username: mockUser.username,
  enteredGameId: testGame.gameId,
  startTime: testGame.startTime,
  message: "",
};

export const mockPostEnteredGameRequest2: PostEnteredGameRequest = {
  username: mockUser.username,
  enteredGameId: testGame2.gameId,
  startTime: testGame2.startTime,
  message: "",
};
