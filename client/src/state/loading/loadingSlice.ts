import { createSlice } from "@reduxjs/toolkit";

const loadingSlice = createSlice({
  name: "loading",
  initialState: false,
  reducers: {
    startLoading: () => true,
    stopLoading: () => false,
  },
});

export const { startLoading, stopLoading } = loadingSlice.actions;

export const loadingReducer = loadingSlice.reducer;
