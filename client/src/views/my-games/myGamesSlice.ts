import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyGamesState, RootState } from "client/types/reduxTypes";
import { Game } from "shared/types/models/game";
import { SelectedGame, UserGames } from "shared/types/models/user";

const initialState: MyGamesState = {
  enteredGames: [],
  favoritedGames: [],
  signedGames: [],
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
        signedGames: action.payload.signedGames,
      };
    },

    submitUpdateFavoritesAsync(state, action: PayloadAction<readonly Game[]>) {
      return {
        ...state,
        favoritedGames: action.payload,
      };
    },

    submitPostSignedGamesAsync(
      state,
      action: PayloadAction<readonly SelectedGame[]>,
    ) {
      return { ...state, signedGames: action.payload };
    },

    submitPostEnteredGameAsync(state, action: PayloadAction<SelectedGame>) {
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
  submitPostSignedGamesAsync,
  submitPostEnteredGameAsync,
  submitDeleteEnteredAsync,
} = myGamesSlice.actions;

export const myGamesReducer = myGamesSlice.reducer;

// SELECTORS

export const selectEnteredGames = (state: RootState): readonly SelectedGame[] =>
  state.myGames.enteredGames;
export const selectSignedGames = (state: RootState): readonly SelectedGame[] =>
  state.myGames.signedGames;
export const selectFavoritedGames = (state: RootState): readonly Game[] =>
  state.myGames.favoritedGames;
