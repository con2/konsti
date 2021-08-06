import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SignupState } from "client/typings/redux.typings";
import { SelectedGame } from "shared/typings/models/user";

const initialState: SignupState = {
  signupTime: "",
  selectedGames: [],
  unsavedChanges: false,
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    submitSignupTime(state, action: PayloadAction<string>) {
      return { ...state, signupTime: action.payload };
    },

    submitSelectedGames(state, action: PayloadAction<readonly SelectedGame[]>) {
      return { ...state, selectedGames: action.payload };
    },

    updateUnsavedChangesStatus(state, action: PayloadAction<boolean>) {
      return { ...state, unsavedChanges: action.payload };
    },
  },
});

export const {
  submitSignupTime,
  submitSelectedGames,
  updateUnsavedChangesStatus,
} = signupSlice.actions;

export const signupReducer = signupSlice.reducer;
