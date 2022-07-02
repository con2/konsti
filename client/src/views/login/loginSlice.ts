import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState } from "client/typings/redux.typings";
import { UserGroup } from "shared/typings/models/user";
import { SubmitLoginPayload } from "client/views/login/loginTypes";
import { loadSession } from "client/utils/localStorage";

const initialState = (): LoginState => {
  const persistedState = loadSession();

  return {
    username: "",
    loggedIn: false,
    jwt: persistedState?.login?.jwt ?? "",
    userGroup: UserGroup.USER,
    serial: "",
  };
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    submitLoginAsync(state, action: PayloadAction<SubmitLoginPayload>) {
      return {
        ...state,
        username: action.payload.username,
        loggedIn: action.payload.loggedIn,
        jwt: action.payload.jwt,
        userGroup: action.payload.userGroup,
        serial: action.payload.serial,
      };
    },
  },
});

export const { submitLoginAsync } = loginSlice.actions;

export const loginReducer = loginSlice.reducer;
