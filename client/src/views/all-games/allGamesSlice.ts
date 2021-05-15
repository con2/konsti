import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AllGamesState } from 'client/typings/redux.typings';
import { Game } from 'shared/typings/models/game';

const initialState: AllGamesState = { games: [] };

const allGamesSlice = createSlice({
  name: 'allGames',
  initialState,
  reducers: {
    submitGetGamesAsync(state, action: PayloadAction<readonly Game[]>) {
      return { ...state, games: action.payload };
    },
  },
});

export const { submitGetGamesAsync } = allGamesSlice.actions;

export const allGamesReducer = allGamesSlice.reducer;
