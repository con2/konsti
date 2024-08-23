import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GroupState } from "client/types/reduxTypes";
import { GroupMember } from "shared/types/models/groups";

const initialState: GroupState = {
  groupCode: "0",
  isGroupCreator: false,
  groupMembers: [],
};

interface GroupCodeUpdate {
  groupCode: string;
  isGroupCreator: boolean;
}

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    submitUpdateGroupCodeAsync(
      state,
      action: PayloadAction<GroupCodeUpdate>,
    ): GroupState {
      return {
        ...state,
        groupCode: action.payload.groupCode,
        isGroupCreator: action.payload.isGroupCreator,
      };
    },

    submitLeaveGroupAsync(state, action: PayloadAction<string>): GroupState {
      return { ...state, groupCode: action.payload, groupMembers: [] };
    },

    submitUpdateGroupAsync(
      state,
      action: PayloadAction<readonly GroupMember[]>,
    ): GroupState {
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
