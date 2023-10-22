import { z } from "zod";
import { ApiError, ApiResult } from "shared/typings/api/errors";
import { SignupMessage } from "shared/typings/models/signupMessage";
import { UserGames } from "shared/typings/models/user";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { sharedConfig } from "shared/config/sharedConfig";
import { EventLogItem } from "shared/typings/models/eventLog";

// GET user

export interface GetUserResponse extends ApiResult {
  games: UserGames;
  serial: string;
  username: string;
  eventLogItems: EventLogItem[];
}

// POST user

export const PostUserRequestSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH_MIN).max(USERNAME_LENGTH_MAX),
  password: z.string().trim().min(PASSWORD_LENGTH_MIN).max(PASSWORD_LENGTH_MAX),
  serial: z
    .string()
    .optional()
    .refine((input) => {
      if (sharedConfig.requireRegistrationCode) {
        if (!input || input.trim().length === 0) {
          return false;
        }
      }
      return true;
    }),
});

export type PostUserRequest = z.infer<typeof PostUserRequestSchema>;

export interface PostUserResponse extends ApiResult {
  password: string;
  username: string;
}

export interface PostUserError extends ApiError {
  errorId: "unknown" | "invalidSerial" | "usernameNotFree";
}

// POST update user password

export const PostUpdateUserPasswordRequestSchema = z.object({
  userToUpdateUsername: z.string(),
  password: z.string(),
});

export type PostUpdateUserPasswordRequest = z.infer<
  typeof PostUpdateUserPasswordRequestSchema
>;

export interface PostUpdateUserPasswordResponse extends ApiResult {
  username: string;
}

// GET user by serial

export const GetUserBySerialRequestSchema = z.object({
  searchTerm: z.string(),
});

export type GetUserBySerialRequest = z.infer<
  typeof GetUserBySerialRequestSchema
>;

export interface GetUserBySerialResponse extends ApiResult {
  serial: string;
  username: string;
  createdAt: string;
}

// GET signup messages

export interface GetSignupMessagesResponse extends ApiResult {
  signupMessages: SignupMessage[];
}

export interface GetSignupMessagesError extends ApiError {
  errorId: "unknown";
}
