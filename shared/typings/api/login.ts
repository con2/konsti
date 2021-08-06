import { UserGroup } from "shared/typings/models/user";

export interface PostLoginResponse {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  status: "success";
  userGroup: UserGroup;
  username: string;
}

export interface LoginFormFields {
  username: string;
  password: string;
}

export interface SessionRecoveryRequest {
  jwt: string;
}

export interface RegistrationFormFields {
  password: string;
  registerDescription: boolean;
  serial?: string;
  username: string;
}

export interface UpdateUserPasswordRequest {
  username: string;
  password: string;
}
