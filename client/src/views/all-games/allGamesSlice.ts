import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllGamesState } from "client/types/reduxTypes";
import { GameWithUsernames } from "shared/types/models/game";

const initialState: AllGamesState = { games: [], signups: [] };

const allGamesSlice = createSlice({
  name: "allGames",
  initialState,
  reducers: {
    submitGetGamesAsync(
      state,
      action: PayloadAction<readonly GameWithUsernames[]>,
    ) {
      return {
        ...state,
        games: action.payload.map((gameWithPlayers) => gameWithPlayers.game),
        signups: action.payload.map((gameWithPlayers) => {
          return {
            users: gameWithPlayers.users,
            gameId: gameWithPlayers.game.gameId,
          };
        }),
      };
    },
  },
});

export const { submitGetGamesAsync } = allGamesSlice.actions;

export const allGamesReducer = allGamesSlice.reducer;
