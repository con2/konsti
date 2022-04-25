import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GroupState } from "client/typings/redux.typings";
import { GroupMember } from "shared/typings/api/groups";

const initialState: GroupState = {
  groupCode: "0",
  groupMembers: [],
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
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
  submitUpdateGroupCodeAsync,
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
} = groupSlice.actions;

export const groupReducer = groupSlice.reducer;
