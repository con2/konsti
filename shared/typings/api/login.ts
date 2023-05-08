import { ApiError } from "shared/typings/api/errors";
import { UserGroup } from "shared/typings/models/user";

export interface PostLoginRequest {
  username: string;
  password: string;
}

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

export interface SessionRecoveryRequest {
  jwt: string;
}

export interface UpdateUserPasswordRequest {
  username: string;
  password: string;
}
