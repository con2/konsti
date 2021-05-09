import { GroupMember } from 'client/typings/group.typings';

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
