import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { NewUser } from "server/types/userTypes";
import { LotterySignup, UserGroup } from "shared/types/models/user";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";

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

export const mockLotterySignups: readonly LotterySignup[] = [
  {
    programItemId: testProgramItem.programItemId,
    priority: 1,
    signedToStartTime: testProgramItem.startTime,
  },
  {
    programItemId: testProgramItem2.programItemId,
    priority: 1,
    signedToStartTime: testProgramItem2.startTime,
  },
];

export const mockPostDirectSignupRequest: SignupRepositoryAddSignup = {
  username: mockUser.username,
  directSignupProgramItemId: testProgramItem.programItemId,
  signedToStartTime: testProgramItem.startTime,
  message: "",
  priority: DIRECT_SIGNUP_PRIORITY,
};

export const mockPostDirectSignupRequest2: SignupRepositoryAddSignup = {
  username: mockUser.username,
  directSignupProgramItemId: testProgramItem2.programItemId,
  signedToStartTime: testProgramItem2.startTime,
  message: "",
  priority: DIRECT_SIGNUP_PRIORITY,
};
