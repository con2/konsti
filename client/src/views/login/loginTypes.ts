import { UserGroup } from "shared/typings/models/user";

export interface SubmitLoginPayload {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
}
