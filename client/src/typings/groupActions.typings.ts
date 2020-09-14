import { GroupMember } from 'typings/group.typings';

export const SUBMIT_UPDATE_GROUP_CODE = 'SUBMIT_UPDATE_GROUP_CODE';
export const SUBMIT_LEAVE_GROUP = 'SUBMIT_LEAVE_GROUP';
export const SUBMIT_UPDATE_GROUP_MEMBERS = 'SUBMIT_UPDATE_GROUP_MEMBERS';

export interface SubmitUpdateGroupCodeAsync {
  type: typeof SUBMIT_UPDATE_GROUP_CODE;
  groupCode: string;
}

export interface SubmitGetGroupAsync {
  type: typeof SUBMIT_UPDATE_GROUP_MEMBERS;
  groupMembers: readonly GroupMember[];
}

export interface SubmitLeaveGroupAsync {
  type: typeof SUBMIT_LEAVE_GROUP;
  groupCode: string;
}

export type GroupActionTypes =
  | SubmitUpdateGroupCodeAsync
  | SubmitGetGroupAsync
  | SubmitLeaveGroupAsync;
