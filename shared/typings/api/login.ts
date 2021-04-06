import { UserGroup } from 'client/typings/user.typings';

export interface PostLoginResponse {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  status: 'success';
  userGroup: UserGroup;
  username: string;
}
