import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState } from "client/typings/redux.typings";
import { UserGroup } from "shared/typings/models/user";
import { loadSession } from "client/utils/localStorage";
import { ActionLogItem } from "shared/typings/models/actionLog";

const initialState = (): LoginState => {
  const persistedState = loadSession();

  return {
    username: "",
    loggedIn: false,
    jwt: persistedState?.login?.jwt ?? "",
    userGroup: UserGroup.USER,
    serial: "",
    actionLogItems: [],
  };
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    submitLoginAsync(state, action: PayloadAction<LoginState>) {
      return {
        ...state,
        username: action.payload.username,
        loggedIn: action.payload.loggedIn,
        jwt: action.payload.jwt,
        userGroup: action.payload.userGroup,
        serial: action.payload.serial,
        actionLogItems: action.payload.actionLogItems,
      };
    },

    submitUpdateActionLogIsSeenAsync(
      state,
      action: PayloadAction<ActionLogItem[]>
    ) {
      return {
        ...state,
        actionLogItems: action.payload,
      };
    },
  },
});

export const { submitLoginAsync, submitUpdateActionLogIsSeenAsync } =
  loginSlice.actions;

export const loginReducer = loginSlice.reducer;
