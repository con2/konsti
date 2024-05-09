import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyGamesState, RootState } from "client/types/reduxTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, UserGames } from "shared/types/models/user";

const initialState: MyGamesState = {
  directSignups: [],
  favoritedGames: [],
  lotterySignups: [],
};

const myGamesSlice = createSlice({
  name: "myGames",
  initialState,
  reducers: {
    submitGetUserAsync(state, action: PayloadAction<UserGames>) {
      return {
        ...state,
        directSignups: action.payload.directSignups,
        favoritedGames: action.payload.favoritedGames,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(
      state,
      action: PayloadAction<readonly ProgramItem[]>,
    ) {
      return {
        ...state,
        favoritedGames: action.payload,
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
} = myGamesSlice.actions;

export const myGamesReducer = myGamesSlice.reducer;

// SELECTORS

export const selectDirectSignups = (state: RootState): readonly Signup[] =>
  state.myGames.directSignups;
export const selectLotterySignups = (state: RootState): readonly Signup[] =>
  state.myGames.lotterySignups;
export const selectFavoritedGames = (
  state: RootState,
): readonly ProgramItem[] => state.myGames.favoritedGames;
