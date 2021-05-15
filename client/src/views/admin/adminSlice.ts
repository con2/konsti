import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminState } from 'client/typings/redux.typings';
import { SubmitGetSettingsPayload } from 'client/views/admin/adminTypes';
import { Game } from 'shared/typings/models/game';

const initialState: AdminState = {
  hiddenGames: [],
  signupTime: '',
  testTime: '',
  appOpen: true,
  responseMessage: '',
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    submitUpdateHiddenAsync(state, action: PayloadAction<readonly Game[]>) {
      return { ...state, hiddenGames: action.payload };
    },

    submitGetSettingsAsync(
      state,
      action: PayloadAction<SubmitGetSettingsPayload>
    ) {
      return {
        ...state,
        hiddenGames: action.payload.hiddenGames,
        signupTime: action.payload.signupTime,
        appOpen: action.payload.appOpen,
      };
    },

    submitSignupTimeAsync(state, action: PayloadAction<string>) {
      return { ...state, signupTime: action.payload };
    },

    submitSetTestTime(state, action: PayloadAction<string>) {
      return { ...state, testTime: action.payload };
    },

    submitToggleAppOpenAsync(state, action: PayloadAction<boolean>) {
      return { ...state, appOpen: action.payload };
    },

    submitResponseMessageAsync(state, action: PayloadAction<string>) {
      return { ...state, responseMessage: action.payload };
    },
  },
});

export const {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitSignupTimeAsync,
  submitSetTestTime,
  submitToggleAppOpenAsync,
  submitResponseMessageAsync,
} = adminSlice.actions;

export const adminReducer = adminSlice.reducer;
