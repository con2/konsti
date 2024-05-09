import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllGamesState } from "client/types/reduxTypes";
import { ProgramItemWithUserSignups } from "shared/types/models/programItem";

const initialState: AllGamesState = { programItems: [], directSignups: [] };

const allGamesSlice = createSlice({
  name: "allGames",
  initialState,
  reducers: {
    submitGetGamesAsync(
      state,
      action: PayloadAction<readonly ProgramItemWithUserSignups[]>,
    ) {
      return {
        ...state,
        programItems: action.payload.map(
          (gameWithPlayers) => gameWithPlayers.game,
        ),
        directSignups: action.payload.map((gameWithPlayers) => {
          return {
            users: gameWithPlayers.users,
            programItemId: gameWithPlayers.game.programItemId,
          };
        }),
      };
    },
  },
});

export const { submitGetGamesAsync } = allGamesSlice.actions;

export const allGamesReducer = allGamesSlice.reducer;
