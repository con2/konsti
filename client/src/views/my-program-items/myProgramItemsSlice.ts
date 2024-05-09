import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyProgramItemsState, RootState } from "client/types/reduxTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, UserProgramItems } from "shared/types/models/user";

const initialState: MyProgramItemsState = {
  directSignups: [],
  favoritedProgramItems: [],
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
        favoritedProgramItems: action.payload.favoritedProgramItems,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(
      state,
      action: PayloadAction<readonly ProgramItem[]>,
    ) {
      return {
        ...state,
        favoritedProgramItems: action.payload,
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
        (game) => game.programItemDetails.programItemId !== action.payload,
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
  state.myGames.directSignups;
export const selectLotterySignups = (state: RootState): readonly Signup[] =>
  state.myGames.lotterySignups;
export const selectFavoritedGames = (
  state: RootState,
): readonly ProgramItem[] => state.myGames.favoritedProgramItems;
