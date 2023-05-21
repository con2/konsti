import { z } from "zod";
import { ApiError } from "shared/typings/api/errors";
import { SignupMessage } from "shared/typings/models/signupMessage";
import { UserGames } from "shared/typings/models/user";

export const GetUserRequestSchema = z.object({
  username: z.string(),
});

export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;

export interface GetUserResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface PostUserRequest {
  username: string;
  password: string;
  serial?: string;
}

export interface PostUserResponse {
  message: string;
  password: string;
  status: "success";
  username: string;
}

export interface PostUserError extends ApiError {
  errorId: "unknown" | "invalidSerial" | "usernameNotFree";
}

export const PostUpdateUserPasswordRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  requester: z.string(),
});

export type PostUpdateUserPasswordRequest = z.infer<
  typeof PostUpdateUserPasswordRequestSchema
>;

export type PostUpdateUserPasswordResponse = PostUserResponse;

export const GetUserBySerialRequestSchema = z.object({
  searchTerm: z.string(),
});

export type GetUserBySerialRequest = z.infer<
  typeof GetUserBySerialRequestSchema
>;

export interface GetUserBySerialResponse {
  message: string;
  serial: string;
  status: "success";
  username: string;
}

export interface GetSignupMessagesResponse {
  signupMessages: SignupMessage[];
  message: string;
  status: "success";
}

export interface GetSignupMessagesError extends ApiError {
  errorId: "unknown";
}
