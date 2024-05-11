import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllProgramItemsState } from "client/types/reduxTypes";
import { ProgramItemWithUserSignups } from "shared/types/models/programItem";

const initialState: AllProgramItemsState = {
  programItems: [],
  directSignups: [],
};

const allProgramItemsSlice = createSlice({
  name: "allProgramItems",
  initialState,
  reducers: {
    submitGetProgramItemsAsync(
      state,
      action: PayloadAction<readonly ProgramItemWithUserSignups[]>,
    ) {
      return {
        ...state,
        programItems: action.payload.map(
          (programItemWithAttendees) => programItemWithAttendees.programItem,
        ),
        directSignups: action.payload.map((programItemWithAttendees) => {
          return {
            users: programItemWithAttendees.users,
            programItemId: programItemWithAttendees.programItem.programItemId,
          };
        }),
      };
    },
  },
});

export const { submitGetProgramItemsAsync } = allProgramItemsSlice.actions;

export const allProgramItemsReducer = allProgramItemsSlice.reducer;
