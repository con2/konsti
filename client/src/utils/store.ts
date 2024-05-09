import { combineReducers } from "redux";
import { Action, configureStore } from "@reduxjs/toolkit";
import { createReduxEnhancer } from "@sentry/react";
import { config } from "shared/config";
import { RootState } from "client/types/reduxTypes";
import { SUBMIT_LOGOUT } from "client/types/logoutActionsTypes";

// Reducers
import { allProgramItemsReducer } from "client/views/all-program-items/allProgramItemsSlice";
import { loginReducer } from "client/views/login/loginSlice";
import { myProgramItemsReducer } from "client/views/my-program-items/myProgramItemsSlice";
import { adminReducer } from "client/views/admin/adminSlice";
import { testSettingsReducer } from "client/test/test-settings/testSettingsSlice";
import { groupReducer } from "client/views/group/groupSlice";

export const combinedReducer = combineReducers({
  allGames: allProgramItemsReducer,
  login: loginReducer,
  myGames: myProgramItemsReducer,
  admin: adminReducer,
  testSettings: testSettingsReducer,
  group: groupReducer,
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

    if (state?.allGames) {
      newState.allGames = state.allGames;
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

const ignoredActions = [
  "allGames/submitGetGamesAsync", // Games is huge
  "admin/submitGetSettingsAsync", // HiddenGames is huge
  "admin/submitGetSignupMessagesAsync", // Private
];

const sentryReduxEnhancer = createReduxEnhancer({
  actionTransformer: (action) => {
    // Don't send large payloads or private data to sentry
    if (ignoredActions.includes(action.type as string)) {
      return null;
    }

    return action;
  },

  stateTransformer: (state: RootState) => {
    // Transform the state to remove unnecessary data

    /* eslint-disable @typescript-eslint/no-unnecessary-condition -- No idea what state the app state is in */
    const transformedState = {
      ...state,
      allGames: {
        ...state?.allGames,
        programItems: `Program items count: ${state?.allGames?.programItems?.length}`,
        directSignups: `Direct signups count: ${state?.allGames?.directSignups?.length}`,
      },
      admin: {
        ...state?.admin,
        hiddenGames: `Hidden games count: ${state?.admin?.hiddenProgramItems?.length}`,
        signupQuestions: `Signup questions count: ${state?.admin?.signupQuestions?.length}`,
        signupMessages: `Signup messages count: ${state?.admin?.signupMessages?.length}`,
      },
      myGames: {
        ...state?.myGames,
        directSignups: state?.myGames?.directSignups?.map((directSignup) => ({
          ...directSignup,
          programItemDetails: directSignup?.programItemDetails?.programItemId,
          message: "<Message hidden>",
        })),
        lotterySignups: state?.myGames?.lotterySignups?.map(
          (lotterySignup) => ({
            ...lotterySignup,
            programItemDetails:
              lotterySignup?.programItemDetails?.programItemId,
          }),
        ),
        favoritedProgramItems: state?.myGames?.favoritedProgramItems?.map(
          (favoritedProgramItem) => favoritedProgramItem?.programItemId,
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
    process.env.SETTINGS !== "production"
      ? {
          trace: config.client().enableReduxTrace,
          traceLimit: 25,
        }
      : false,
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(sentryReduxEnhancer),
});
