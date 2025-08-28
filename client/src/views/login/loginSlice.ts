import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState } from "client/types/reduxTypes";
import { UserGroup } from "shared/types/models/user";
import { loadSession } from "client/utils/localStorage";
import { EventLogItem } from "shared/types/models/eventLog";
import {
  PostFinalizeLogin,
  PostVerifyKompassiLoginPayload,
} from "shared/types/api/login";

const initialState = (): LoginState => {
  const persistedState = loadSession();

  return {
    username: "",
    loggedIn: false,
    jwt: persistedState?.login?.jwt ?? "",
    userGroup: UserGroup.USER,
    serial: "",
    eventLogItems: [],
    kompassiUsernameAccepted: false,
    kompassiId: 0,
    email: "",
    emailNotificationPermitAsked: false,
  };
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    submitLoginAsync(state, action: PayloadAction<LoginState>): LoginState {
      return {
        ...state,
        username: action.payload.username,
        loggedIn: action.payload.loggedIn,
        jwt: action.payload.jwt,
        userGroup: action.payload.userGroup,
        serial: action.payload.serial,
        eventLogItems: action.payload.eventLogItems,
        kompassiUsernameAccepted: action.payload.kompassiUsernameAccepted,
        kompassiId: action.payload.kompassiId,
        email: action.payload.email,
        emailNotificationPermitAsked:
          action.payload.emailNotificationPermitAsked,
      };
    },

    submitUpdateEventLogItemsAsync(
      state,
      action: PayloadAction<EventLogItem[]>,
    ): LoginState {
      return {
        ...state,
        eventLogItems: action.payload,
      };
    },

    submitVerifyKompassiLoginAsync(
      state,
      action: PayloadAction<PostVerifyKompassiLoginPayload>,
    ): LoginState {
      return {
        ...state,
        username: action.payload.username,
        kompassiUsernameAccepted: action.payload.kompassiUsernameAccepted,
        jwt: action.payload.jwt,
      };
    },
    submitFinalizeLoginAsync(
      state,
      action: PayloadAction<PostFinalizeLogin>,
    ): LoginState {
      return {
        ...state,
        email: action.payload.email,
        emailNotificationPermitAsked:
          action.payload.emailNotificationPermitAsked,
        jwt: action.payload.jwt,
      };
    },
  },
});

export const {
  submitLoginAsync,
  submitUpdateEventLogItemsAsync,
  submitVerifyKompassiLoginAsync,
  submitFinalizeLoginAsync,
} = loginSlice.actions;

export const loginReducer = loginSlice.reducer;
