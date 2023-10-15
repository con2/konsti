import { z } from "zod";
import { ApiError, ApiResult } from "shared/typings/api/errors";
import { UserGroup } from "shared/typings/models/user";
import { EventLogItem } from "shared/typings/models/eventLog";

// POST login

export const PostLoginRequestSchema = z.object({
  username: z.string(),
  password: z.string().min(1),
});

export type PostLoginRequest = z.infer<typeof PostLoginRequestSchema>;

export interface PostLoginResponse extends ApiResult {
  groupCode: string;
  jwt: string;
  serial: string;
  userGroup: UserGroup;
  username: string;
  eventLogItems: EventLogItem[];
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
