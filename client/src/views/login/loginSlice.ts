import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState } from "client/typings/redux.typings";
import { UserGroup } from "shared/typings/models/user";
import { loadSession } from "client/utils/localStorage";
import { EventLogItem } from "shared/typings/models/eventLog";

const initialState = (): LoginState => {
  const persistedState = loadSession();

  return {
    username: "",
    loggedIn: false,
    jwt: persistedState?.login?.jwt ?? "",
    userGroup: UserGroup.USER,
    serial: "",
    eventLogItems: [],
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
        eventLogItems: action.payload.eventLogItems,
      };
    },

    submitUpdateEventLogItemsAsync(
      state,
      action: PayloadAction<EventLogItem[]>
    ) {
      return {
        ...state,
        eventLogItems: action.payload,
      };
    },
  },
});

export const { submitLoginAsync, submitUpdateEventLogItemsAsync } =
  loginSlice.actions;

export const loginReducer = loginSlice.reducer;
