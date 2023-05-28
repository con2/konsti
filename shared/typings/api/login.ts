import { z } from "zod";
import { ApiError, ApiResult } from "shared/typings/api/errors";
import { UserGroup } from "shared/typings/models/user";

// POST login

export const PostLoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type PostLoginRequest = z.infer<typeof PostLoginRequestSchema>;

export interface PostLoginResponse extends ApiResult {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  userGroup: UserGroup;
  username: string;
}

export interface PostLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled";
}

// POST session recovery

export interface PostSessionRecoveryRequest {
  jwt: string;
}

export type PostSessionRecoveryResponse = PostLoginResponse;
