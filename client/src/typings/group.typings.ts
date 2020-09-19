import { Signup } from 'typings/user.typings';

export interface GroupMember {
  enteredGames: readonly Signup[];
  groupCode: string;
  serial: string;
  signedGames: readonly Signup[];
  username: string;
}

export interface GroupData {
  groupCode: string;
  leader: boolean;
  ownSerial: string;
  username: string;
  leaveGroup?: boolean;
  closeGroup?: boolean;
}

export interface PostGroupResponse {
  groupCode: string;
  message: string;
  status: 'success';
}

export interface GetGroupResponse {
  message: string;
  results: GroupMember[];
  status: 'success';
}
