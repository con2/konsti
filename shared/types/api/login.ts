import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { UserGroup } from "shared/types/models/user";
import { EventLogItem } from "shared/types/models/eventLog";

// POST login

export const PostLoginRequestSchema = z.object({
  username: z.string(),
  password: z.string().min(1),
});

export type PostLoginRequest = z.infer<typeof PostLoginRequestSchema>;

export interface PostLoginResponse extends ApiResult {
  groupCode: string;
  groupCreatorCode: string;
  jwt: string;
  serial: string;
  userGroup: UserGroup;
  username: string;
  eventLogItems: EventLogItem[];
  kompassiUsernameAccepted: boolean;
  kompassiId: number;
}

export interface PostLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled";
}

// POST session recovery

export interface PostSessionRecoveryRequest {
  jwt: string;
}

export type PostSessionRecoveryResponse = PostLoginResponse;

// POST Kompassi login

export const PostKompassiLoginRequestSchema = z.object({ code: z.string() });

export type PostKompassiLoginRequest = z.infer<
  typeof PostKompassiLoginRequestSchema
>;

export type PostKompassiLoginResponse = PostLoginResponse;

export interface PostKompassiLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled" | "invalidUserGroup";
}

// POST Verify Kompassi login

export const PostVerifyKompassiLoginRequestSchema = z.object({
  username: z.string().trim(),
});

export type PostVerifyKompassiLoginRequest = z.infer<
  typeof PostVerifyKompassiLoginRequestSchema
>;

export interface PostVerifyKompassiLoginPayload {
  username: string;
  kompassiUsernameAccepted: boolean;
  jwt: string;
}

export type PostVerifyKompassiLoginResponse = PostVerifyKompassiLoginPayload &
  ApiResult;

export interface PostVerifyKompassiLoginError extends ApiError {
  errorId: "unknown" | "usernameNotFree";
}
