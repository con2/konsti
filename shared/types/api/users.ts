import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { SignupMessage } from "shared/types/models/signupMessage";
import { UserProgramItems } from "shared/types/models/user";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { EventLogItem } from "shared/types/models/eventLog";

// GET user

interface GetUserResult extends ApiResult {
  programItems: UserProgramItems;
  serial: string;
  groupCode: string;
  isGroupCreator: boolean;
  username: string;
  eventLogItems: EventLogItem[];
  email: string;
}

interface GetUserError extends ApiError {
  errorId: "unknown";
}

export type GetUserResponse = GetUserResult | GetUserError;

// POST user

export const PostUserRequestSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH_MIN).max(USERNAME_LENGTH_MAX),
  password: z.string().trim().min(PASSWORD_LENGTH_MIN).max(PASSWORD_LENGTH_MAX),
  // Local account creation always requires a registration code
  serial: z
    .string()
    .min(1)
    .transform((val) => val.replaceAll("-", "")), // remove dashes
});

export type PostUserRequest = z.infer<typeof PostUserRequestSchema>;

interface PostUserResult extends ApiResult {
  username: string;
}

interface PostUserError extends ApiError {
  errorId: "unknown" | "invalidSerial" | "usernameNotFree";
}

export type PostUserResponse = PostUserResult | PostUserError;

// POST update user password

export const PostUpdateUserPasswordRequestSchema = z.object({
  usernameToUpdate: z.string(),
  password: z.string().trim().min(PASSWORD_LENGTH_MIN).max(PASSWORD_LENGTH_MAX),
});

export type PostUpdateUserPasswordRequest = z.infer<
  typeof PostUpdateUserPasswordRequestSchema
>;

export interface PostUpdateUserPasswordResult extends ApiResult {
  username: string;
}

export interface PostUpdateUserPasswordError extends ApiError {
  errorId: "unknown" | "notAllowed";
}

export type PostUpdateUserPasswordResponse =
  | PostUpdateUserPasswordResult
  | PostUpdateUserPasswordError;

// GET user by serial

export const GetUserBySerialRequestSchema = z.object({
  searchTerm: z.string(),
});

export type GetUserBySerialRequest = z.infer<
  typeof GetUserBySerialRequestSchema
>;

interface GetUserBySerialResult extends ApiResult {
  serial: string;
  username: string;
  createdAt: string;
}

interface GetUserBySerialError extends ApiError {
  errorId: "unknown" | "kompassiLogin";
}

export type GetUserBySerialResponse =
  | GetUserBySerialResult
  | GetUserBySerialError;

// GET signup messages

export interface GetSignupMessagesResult extends ApiResult {
  signupMessages: SignupMessage[];
}

interface GetSignupMessagesError extends ApiError {
  errorId: "unknown";
}

export type GetSignupMessagesResponse =
  | GetSignupMessagesResult
  | GetSignupMessagesError;
