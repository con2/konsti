import { z } from "zod";
import { ApiError } from "shared/typings/api/errors";
import { UserGroup } from "shared/typings/models/user";

export const PostLoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type PostLoginRequest = z.infer<typeof PostLoginRequestSchema>;

export interface PostLoginResponse {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  status: "success";
  userGroup: UserGroup;
  username: string;
}

export interface PostLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled";
}

export interface PostSessionRecoveryRequest {
  jwt: string;
}

export type PostSessionRecoveryResponse = PostLoginResponse;
