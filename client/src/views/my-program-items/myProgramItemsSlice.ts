import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyProgramItemsState, RootState } from "client/types/reduxTypes";
import { selectProgramItems } from "client/views/all-program-items/allProgramItemsSlice";
import {
  FavoriteProgramItemId,
  Signup,
  UserProgramItems,
} from "shared/types/models/user";

const initialState: MyProgramItemsState = {
  directSignups: [],
  favoriteProgramItemIds: [],
  lotterySignups: [],
};

const myProgramItemsSlice = createSlice({
  name: "myProgramItems",
  initialState,
  reducers: {
    submitGetUserAsync(state, action: PayloadAction<UserProgramItems>) {
      return {
        ...state,
        directSignups: action.payload.directSignups,
        favoriteProgramItems: action.payload.favoriteProgramItemIds,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(
      state,
      action: PayloadAction<readonly FavoriteProgramItemId[]>,
    ) {
      return {
        ...state,
        favoriteProgramItemIds: action.payload,
      };
    },

    submitPostLotterySignupsAsync(
      state,
      action: PayloadAction<readonly Signup[]>,
    ) {
      return { ...state, lotterySignups: action.payload };
    },

    submitPostDirectSignupAsync(state, action: PayloadAction<Signup>) {
      const directSignups = [...state.directSignups, action.payload];
      return { ...state, directSignups };
    },

    submitDeleteDirectSignupAsync(state, action: PayloadAction<string>) {
      const directSignups = state.directSignups.filter(
        (programItem) =>
          programItem.programItem.programItemId !== action.payload,
      );
      return { ...state, directSignups };
    },
  },
});

export const {
  submitGetUserAsync,
  submitUpdateFavoritesAsync,
  submitPostLotterySignupsAsync,
  submitPostDirectSignupAsync,
  submitDeleteDirectSignupAsync,
} = myProgramItemsSlice.actions;

export const myProgramItemsReducer = myProgramItemsSlice.reducer;

// SELECTORS

export const selectDirectSignups = (state: RootState): readonly Signup[] =>
  state.myProgramItems.directSignups;

export const selectLotterySignups = (state: RootState): readonly Signup[] =>
  state.myProgramItems.lotterySignups;

const selectFavoriteProgramItemIds = (
  state: RootState,
): readonly FavoriteProgramItemId[] =>
  state.myProgramItems.favoriteProgramItemIds;

export const selectFavoriteProgramItems = createSelector(
  [selectProgramItems, selectFavoriteProgramItemIds],
  (programItems, favoriteProgramItemIds) => {
    return programItems.filter((programItem) =>
      favoriteProgramItemIds.includes(programItem.programItemId),
    );
  },
);
