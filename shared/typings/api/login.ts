import { UserGroup } from 'shared/typings/models/user';

export interface PostLoginResponse {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  status: 'success';
  userGroup: UserGroup;
  username: string;
}
