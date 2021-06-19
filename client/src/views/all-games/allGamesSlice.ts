import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AllGamesState } from 'client/typings/redux.typings';
import { GameWithPlayers } from 'shared/typings/api/games';

const initialState: AllGamesState = { games: [], signups: [] };

const allGamesSlice = createSlice({
  name: 'allGames',
  initialState,
  reducers: {
    submitGetGamesAsync(
      state,
      action: PayloadAction<readonly GameWithPlayers[]>
    ) {
      return {
        ...state,
        games: action.payload.map((gameWithPlayers) => gameWithPlayers.game),
        signups: action.payload.map((gameWithPlayers) => {
          return {
            usernames: gameWithPlayers.players,
            gameId: gameWithPlayers.game.gameId,
          };
        }),
      };
    },
  },
});

export const { submitGetGamesAsync } = allGamesSlice.actions;

export const allGamesReducer = allGamesSlice.reducer;
