import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyGamesState } from "client/typings/redux.typings";
import { SubmitGetUserPayload } from "client/views/my-games/myGamesTypes";
import { Game } from "shared/typings/models/game";
import { SelectedGame } from "shared/typings/models/user";

const initialState: MyGamesState = {
  enteredGames: [],
  favoritedGames: [],
  signedGames: [],
};

const myGamesSlice = createSlice({
  name: "myGames",
  initialState,
  reducers: {
    submitGetUserAsync(state, action: PayloadAction<SubmitGetUserPayload>) {
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

    submitSignupAsync(state, action: PayloadAction<readonly SelectedGame[]>) {
      return { ...state, signedGames: action.payload };
    },

    submitEnteredAsync(state, action: PayloadAction<SelectedGame>) {
      const games = [...state.enteredGames, action.payload];
      return { ...state, enteredGames: games };
    },

    submitDeleteEnteredAsync(state, action: PayloadAction<string>) {
      const games = state.enteredGames.filter(
        (game) => game.gameDetails.gameId !== action.payload
      );
      return { ...state, enteredGames: games };
    },
  },
});

export const {
  submitGetUserAsync,
  submitUpdateFavoritesAsync,
  submitSignupAsync,
  submitEnteredAsync,
  submitDeleteEnteredAsync,
} = myGamesSlice.actions;

export const myGamesReducer = myGamesSlice.reducer;
