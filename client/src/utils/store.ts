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

const ignoredActions = new Set([
  "allProgramItems/submitGetProgramItemsAsync", // Program items is huge
  "admin/submitGetSignupMessagesAsync", // Private
  "admin/updateServerAppBuildTime", // Dispatched on every poll, would crowd out useful breadcrumbs
]);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const sentryReduxEnhancer = createReduxEnhancer({
  actionTransformer: (action) => {
    // Don't send large payloads or private data to sentry
    if (ignoredActions.has(action.type as string)) {
      return null;
    }

    return action;
  },

  stateTransformer: (state: RootState) => {
    // Reduce state that is too large, private or unnecessary to send

    /* eslint-disable @typescript-eslint/no-unnecessary-condition -- No idea what state the app state is in */
    const transformedState = {
      ...state,
      allProgramItems: {
        ...state?.allProgramItems,
        // Whole program items, too large to send
        programItems: `Program items count: ${state?.allProgramItems?.programItems?.length}`,
        // Whole program items, too large to send
        directSignups: `Direct signups count: ${state?.allProgramItems?.directSignups?.length}`,
      },
      admin: {
        ...state?.admin,
        // Config data - not interesting
        hiddenProgramItemIds: `Hidden program items count: ${state?.admin?.hiddenProgramItemIds?.length}`,
        // Config data - not interesting
        signupQuestions: `Signup questions count: ${state?.admin?.signupQuestions?.length}`,
        // Contains user sign-up messages - helper user only
        signupMessages: `Signup messages count: ${state?.admin?.signupMessages?.length}`,
      },
      myProgramItems: {
        ...state?.myProgramItems,
        directSignups: state?.myProgramItems?.directSignups?.map(
          (directSignup) => ({
            ...directSignup,
            // Remove sign-up question answers
            message: "<Message hidden>",
          }),
        ),
      },
    };
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */

    return transformedState;
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
