import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResultsState } from 'client/typings/redux.typings';

const initialState: ResultsState = { startTime: '', result: [] };

const resultsSlice = createSlice({
  name: 'myGames',
  initialState,
  reducers: {
    submitGetResultsAsync(state, action: PayloadAction<ResultsState>) {
      return {
        ...state,
        result: action.payload.result,
        startTime: action.payload.startTime,
      };
    },
  },
});

export const { submitGetResultsAsync } = resultsSlice.actions;

export const resultsReducer = resultsSlice.reducer;
