import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AdminState } from "client/typings/redux.typings";
import { SubmitGetSettingsPayload } from "client/views/admin/adminTypes";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";
import { SignupMessage } from "shared/typings/models/settings";

const initialState: AdminState = {
  hiddenGames: [],
  activeSignupTime: "",
  testTime: "",
  appOpen: true,
  responseMessage: "",
  signupMessages: [],
  signupStrategy: SignupStrategy.DIRECT,
};

const adminSlice = createSlice({
  name: "admin",
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
        activeSignupTime: action.payload.signupTime,
        appOpen: action.payload.appOpen,
        signupMessages: action.payload.signupMessages,
      };
    },

    submitActiveSignupTimeAsync(state, action: PayloadAction<string>) {
      return { ...state, activeSignupTime: action.payload };
    },

    submitSetTestTime(state, action: PayloadAction<string>) {
      return { ...state, testTime: action.payload };
    },

    submitSetSignupStrategyAsync(state, action: PayloadAction<SignupStrategy>) {
      return { ...state, signupStrategy: action.payload };
    },

    submitToggleAppOpenAsync(state, action: PayloadAction<boolean>) {
      return { ...state, appOpen: action.payload };
    },

    submitResponseMessageAsync(state, action: PayloadAction<string>) {
      return { ...state, responseMessage: action.payload };
    },

    updateSignupMessages(
      state,
      action: PayloadAction<readonly SignupMessage[]>
    ) {
      return { ...state, signupMessages: action.payload };
    },
  },
});

export const {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitActiveSignupTimeAsync,
  submitSetTestTime,
  submitSetSignupStrategyAsync,
  submitToggleAppOpenAsync,
  submitResponseMessageAsync,
  updateSignupMessages,
} = adminSlice.actions;

export const adminReducer = adminSlice.reducer;
