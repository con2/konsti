import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyGamesState, RootState } from "client/types/reduxTypes";
import { Game } from "shared/types/models/game";
import { Signup, UserGames } from "shared/types/models/user";

const initialState: MyGamesState = {
  enteredGames: [],
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
        enteredGames: action.payload.enteredGames,
        favoritedGames: action.payload.favoritedGames,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(state, action: PayloadAction<readonly Game[]>) {
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

    submitPostEnteredGameAsync(state, action: PayloadAction<Signup>) {
      const games = [...state.enteredGames, action.payload];
      return { ...state, enteredGames: games };
    },

    submitDeleteEnteredAsync(state, action: PayloadAction<string>) {
      const games = state.enteredGames.filter(
        (game) => game.gameDetails.gameId !== action.payload,
      );
      return { ...state, enteredGames: games };
    },
  },
});

export const {
  submitGetUserAsync,
  submitUpdateFavoritesAsync,
  submitPostLotterySignupsAsync,
  submitPostEnteredGameAsync,
  submitDeleteEnteredAsync,
} = myGamesSlice.actions;

export const myGamesReducer = myGamesSlice.reducer;

// SELECTORS

export const selectEnteredGames = (state: RootState): readonly Signup[] =>
  state.myGames.enteredGames;
export const selectLotterySignups = (state: RootState): readonly Signup[] =>
  state.myGames.lotterySignups;
export const selectFavoritedGames = (state: RootState): readonly Game[] =>
  state.myGames.favoritedGames;
