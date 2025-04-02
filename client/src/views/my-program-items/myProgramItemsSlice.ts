import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyProgramItemsState, RootState } from "client/types/reduxTypes";
import { selectProgramItems } from "client/views/all-program-items/allProgramItemsSlice";
import {
  DirectSignup,
  FavoriteProgramItemId,
  LotterySignup,
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
    submitGetUserAsync(
      state,
      action: PayloadAction<UserProgramItems>,
    ): MyProgramItemsState {
      return {
        ...state,
        directSignups: action.payload.directSignups,
        favoriteProgramItemIds: action.payload.favoriteProgramItemIds,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(
      state,
      action: PayloadAction<readonly FavoriteProgramItemId[]>,
    ): MyProgramItemsState {
      return {
        ...state,
        favoriteProgramItemIds: action.payload,
      };
    },

    submitPostLotterySignupsAsync(
      state,
      action: PayloadAction<readonly LotterySignup[]>,
    ): MyProgramItemsState {
      return { ...state, lotterySignups: action.payload };
    },

    submitPostDirectSignupAsync(
      state,
      action: PayloadAction<DirectSignup>,
    ): MyProgramItemsState {
      const directSignups = [...state.directSignups, action.payload];
      return { ...state, directSignups };
    },

    submitDeleteDirectSignupAsync(
      state,
      action: PayloadAction<string>,
    ): MyProgramItemsState {
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

export const selectDirectSignups = (
  state: RootState,
): readonly DirectSignup[] => state.myProgramItems.directSignups;

export const selectLotterySignups = (
  state: RootState,
): readonly LotterySignup[] => state.myProgramItems.lotterySignups;

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
