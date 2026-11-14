import { Action, configureStore } from "@reduxjs/toolkit";
import { createReduxEnhancer } from "@sentry/react";
import { combineReducers } from "redux";
import { config } from "shared/config";
import { loadingReducer } from "client/state/loading/loadingSlice";
import { testSettingsReducer } from "client/test/test-settings/testSettingsSlice";
import { SUBMIT_LOGOUT } from "client/types/logoutActionsTypes";
import { RootState } from "client/types/reduxTypes";
import { adminReducer } from "client/views/admin/adminSlice";
// Reducers
import { allProgramItemsReducer } from "client/views/all-program-items/allProgramItemsSlice";
import { groupReducer } from "client/views/group/groupSlice";
import { loginReducer } from "client/views/login/loginSlice";
import { myProgramItemsReducer } from "client/views/my-program-items/myProgramItemsSlice";

export const combinedReducer = combineReducers({
  allProgramItems: allProgramItemsReducer,
  login: loginReducer,
  myProgramItems: myProgramItemsReducer,
  admin: adminReducer,
  testSettings: testSettingsReducer,
  group: groupReducer,
  loading: loadingReducer,
});

// Reducer to reset state
const rootReducer = (
  state: RootState | undefined,
  action: Action,
): RootState => {
  if (action.type === SUBMIT_LOGOUT) {
    const newState = combinedReducer(undefined, action);

    if (state?.admin) {
      newState.admin = state.admin;
    }

    if (state?.allProgramItems) {
      newState.allProgramItems = state.allProgramItems;
    }

    if (
      config.client().loadedSettings !== "production" &&
      state?.testSettings
    ) {
      newState.testSettings = state.testSettings;
    }

    return newState;
  }

  return combinedReducer(state, action);
};

// Only the action types go to Sentry: the state and the payloads hold the user's JWT, their
// identifiers and their sign-up answers, and the timeline is what a crash report needs
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sentryReduxEnhancer = createReduxEnhancer({
  actionTransformer: (action) => {
    return { type: String(action.type) };
  },
  stateTransformer: () => null,
  // Ties a user's errors together; the serial identifies the account until accounts get an ID
  configureScopeWithState: (scope, state: RootState) => {
    const { serial, username } = state.login;
    scope.setUser(serial ? { id: serial, username } : null);
  },
});

export const store = configureStore({
  reducer: rootReducer,
  devTools:
    process.env.SETTINGS === "production"
      ? false
      : {
          trace: config.client().enableReduxTrace,
          traceLimit: 25,
        },
  enhancers: (getDefaultEnhancers) => {
    return getDefaultEnhancers().concat(sentryReduxEnhancer);
  },
});
