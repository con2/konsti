import { testGame, testGame2 } from "shared/tests/testGame";
import { NewUser } from "server/types/userTypes";
import { Signup, UserGroup } from "shared/types/models/user";
import { PostDirectSignupRequest } from "shared/types/api/myGames";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";

export const mockUser: NewUser = {
  kompassiId: 0,
  username: "Test User",
  passwordHash: "$2a$10$RfH4QV71FPDta0wWfCwFreyAWJIZSTB7Rzmn8atwRldJWANuDDIpe", // Hash for password 'password'
  userGroup: UserGroup.USER,
  serial: "1234ABCD",
  groupCode: "0",
};

export const mockUser2: NewUser = {
  kompassiId: 0,
  username: "Test User 2",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "5678IDJL",
  groupCode: "0",
};

export const mockUser3: NewUser = {
  kompassiId: 0,
  username: "Test User 3",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "jhertyee",
  groupCode: "0",
};

export const mockUser4: NewUser = {
  kompassiId: 0,
  username: "Test User 4",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "urtyjjjtyy",
  groupCode: "0",
};

export const mockUser5: NewUser = {
  kompassiId: 0,
  username: "Test User 5",
  passwordHash: "testpass",
  userGroup: UserGroup.USER,
  serial: "ootehhjjj",
  groupCode: "0",
};

export const mockLotterySignups: readonly Signup[] = [
  {
    programItemDetails: testGame,
    priority: 1,
    time: testGame.startTime,
    message: "",
  },
  {
    programItemDetails: testGame2,
    priority: 1,
    time: testGame2.startTime,
    message: "",
  },
];

export const mockPostDirectSignupRequest: PostDirectSignupRequest = {
  username: mockUser.username,
  directSignupProgramItemId: testGame.programItemId,
  startTime: testGame.startTime,
  message: "",
  priority: DIRECT_SIGNUP_PRIORITY,
};

export const mockPostDirectSignupRequest2: PostDirectSignupRequest = {
  username: mockUser.username,
  directSignupProgramItemId: testGame2.programItemId,
  startTime: testGame2.startTime,
  message: "",
  priority: DIRECT_SIGNUP_PRIORITY,
};
