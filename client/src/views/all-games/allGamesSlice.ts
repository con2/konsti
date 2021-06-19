import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AllGamesState } from 'client/typings/redux.typings';
import { GameWithUsernames } from 'shared/typings/api/games';

const initialState: AllGamesState = { games: [], signups: [] };

const allGamesSlice = createSlice({
  name: 'allGames',
  initialState,
  reducers: {
    submitGetGamesAsync(
      state,
      action: PayloadAction<readonly GameWithUsernames[]>
    ) {
      return {
        ...state,
        games: action.payload.map((gameWithPlayers) => gameWithPlayers.game),
        signups: action.payload.map((gameWithPlayers) => {
          return {
            usernames: gameWithPlayers.usernames,
            gameId: gameWithPlayers.game.gameId,
          };
        }),
      };
    },
  },
});

export const { submitGetGamesAsync } = allGamesSlice.actions;

export const allGamesReducer = allGamesSlice.reducer;
