import { UserGroup } from 'typings/user.typings';

export const SUBMIT_LOGIN = 'SUBMIT_LOGIN';

export interface SubmitLoginAsync {
  type: typeof SUBMIT_LOGIN;
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
}

export type LoginActionTypes = SubmitLoginAsync;
