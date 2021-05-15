import { LoginState } from 'client/typings/redux.typings';
import { UserGroup } from 'shared/typings/models/user';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupMember } from 'client/typings/group.typings';
import { SubmitLoginPayload } from 'client/views/login/loginTypes';

const initialState: LoginState = {
  username: '',
  loggedIn: false,
  jwt: '',
  userGroup: UserGroup.USER,
  serial: '',
  groupCode: '0',
  groupMembers: [],
};

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    submitLoginAsync(state, action: PayloadAction<SubmitLoginPayload>) {
      return {
        ...state,
        username: action.payload.username,
        loggedIn: action.payload.loggedIn,
        jwt: action.payload.jwt,
        userGroup: action.payload.userGroup,
        serial: action.payload.serial,
        groupCode: action.payload.groupCode,
      };
    },

    submitUpdateGroupCodeAsync(state, action: PayloadAction<string>) {
      return {
        ...state,
        groupCode: action.payload,
      };
    },

    submitLeaveGroupAsync(state, action: PayloadAction<string>) {
      return { ...state, groupCode: action.payload, groupMembers: [] };
    },

    submitUpdateGroupAsync(
      state,
      action: PayloadAction<readonly GroupMember[]>
    ) {
      return {
        ...state,
        groupMembers: action.payload,
      };
    },
  },
});

export const {
  submitLoginAsync,
  submitUpdateGroupCodeAsync,
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
} = loginSlice.actions;

export const loginReducer = loginSlice.reducer;
