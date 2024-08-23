import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestSettingsState } from "client/types/reduxTypes";

const initialState: TestSettingsState = {
  testTime: "",
};

const testSettingsSlice = createSlice({
  name: "testSettings",
  initialState,
  reducers: {
    submitSetTestTime(state, action: PayloadAction<string>): TestSettingsState {
      return { ...state, testTime: action.payload };
    },
  },
});

export const { submitSetTestTime } = testSettingsSlice.actions;

export const testSettingsReducer = testSettingsSlice.reducer;
