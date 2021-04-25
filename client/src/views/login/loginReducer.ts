import {
  LoginActionTypes,
  SUBMIT_LOGIN,
} from 'client/typings/loginActions.typings';
import {
  GroupActionTypes,
  SUBMIT_UPDATE_GROUP_CODE,
  SUBMIT_LEAVE_GROUP,
  SUBMIT_UPDATE_GROUP_MEMBERS,
} from 'client/typings/groupActions.typings';

import { LoginState } from 'client/typings/redux.typings';
import { UserGroup } from 'client/typings/user.typings';

const initialState: LoginState = {
  username: '',
  loggedIn: false,
  jwt: '',
  userGroup: UserGroup.USER,
  serial: '',
  groupCode: '0',
  groupMembers: [],
};

export const loginReducer = (
  state = initialState,
  action: LoginActionTypes | GroupActionTypes
): LoginState => {
  switch (action.type) {
    case SUBMIT_LOGIN:
      return {
        ...state,
        username: action.username,
        loggedIn: action.loggedIn,
        jwt: action.jwt,
        userGroup: action.userGroup,
        serial: action.serial,
        groupCode: action.groupCode,
      };
    case SUBMIT_UPDATE_GROUP_CODE:
      return {
        ...state,
        groupCode: action.groupCode,
      };
    case SUBMIT_LEAVE_GROUP:
      return { ...state, groupCode: action.groupCode, groupMembers: [] };
    case SUBMIT_UPDATE_GROUP_MEMBERS:
      return {
        ...state,
        groupMembers: action.groupMembers,
      };
    default:
      return state;
  }
};
