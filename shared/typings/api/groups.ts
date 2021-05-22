import { SelectedGame } from 'shared/typings/models/user';

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

export interface GroupData {
  groupCode: string;
  leader: boolean;
  ownSerial: string;
  username: string;
  leaveGroup?: boolean;
  closeGroup?: boolean;
}

export interface GroupMember {
  enteredGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
