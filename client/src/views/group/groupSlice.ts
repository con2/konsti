import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GroupState, RootState } from "client/types/reduxTypes";
import { selectProgramItems } from "client/views/all-program-items/allProgramItemsSlice";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
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

// SELECTORS

export type GroupMemberWithLotteryProgramItem = Omit<
  GroupMember,
  "lotterySignups"
> & {
  lotterySignups: LotterySignupWithProgramItem[];
};

export const selectGroupMembers: (
  state: RootState,
) => GroupMemberWithLotteryProgramItem[] = createSelector(
  [selectProgramItems, (state: RootState) => state.group.groupMembers],
  (programItems, groupMembers) => {
    return groupMembers.map((groupMember) => {
      const updatedSignups: LotterySignupWithProgramItem[] =
        groupMember.lotterySignups.flatMap((lotterySignup) => {
          const signedProgramItem = programItems.find(
            (programItem) =>
              programItem.programItemId === lotterySignup.programItemId,
          );

          if (!signedProgramItem) {
            return [];
          }

          return { ...lotterySignup, programItem: signedProgramItem };
        });
      return { ...groupMember, lotterySignups: updatedSignups };
    });
  },
);
