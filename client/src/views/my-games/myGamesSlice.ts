import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyGamesState, RootState } from "client/typings/redux.typings";
import { Game, ProgramType } from "shared/typings/models/game";
import { SelectedGame, UserGames } from "shared/typings/models/user";

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
      action: PayloadAction<readonly SelectedGame[]>
    ) {
      return { ...state, signedGames: action.payload };
    },

    submitPostEnteredGameAsync(state, action: PayloadAction<SelectedGame>) {
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
  submitPostSignedGamesAsync,
  submitPostEnteredGameAsync,
  submitDeleteEnteredAsync,
} = myGamesSlice.actions;

export const myGamesReducer = myGamesSlice.reducer;

// SELECTORS

const selectEnteredGames = (state: RootState): readonly SelectedGame[] =>
  state.myGames.enteredGames;
const selectSignedGames = (state: RootState): readonly SelectedGame[] =>
  state.myGames.signedGames;
const selectFavoritedGames = (state: RootState): readonly Game[] =>
  state.myGames.favoritedGames;

const selectActiveProgramType = (state: RootState): ProgramType =>
  state.admin.activeProgramType;

export const selectActiveEnteredGames = createSelector(
  [selectEnteredGames, selectActiveProgramType],
  (enteredGames, activeProgramType) => {
    return enteredGames.filter(
      (enteredGame) => enteredGame.gameDetails.programType === activeProgramType
    );
  }
);

export const selectActiveSignedGames = createSelector(
  [selectSignedGames, selectActiveProgramType],
  (signedGames, activeProgramType) => {
    return signedGames.filter(
      (signedGame) => signedGame.gameDetails.programType === activeProgramType
    );
  }
);

export const selectActiveFavoritedGames = createSelector(
  [selectFavoritedGames, selectActiveProgramType],
  (favoritedGames, activeProgramType) => {
    return favoritedGames.filter(
      (favoritedGame) => favoritedGame.programType === activeProgramType
    );
  }
);
