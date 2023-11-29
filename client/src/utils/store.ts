import { combineReducers, CombinedState, AnyAction } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { createReduxEnhancer } from "@sentry/react";
import { config } from "shared/config";
import { RootState } from "client/typings/reduxTypes";
import { SUBMIT_LOGOUT } from "client/typings/logoutActionsTypes";

// Reducers
import { allGamesReducer } from "client/views/all-games/allGamesSlice";
import { loginReducer } from "client/views/login/loginSlice";
import { myGamesReducer } from "client/views/my-games/myGamesSlice";
import { adminReducer } from "client/views/admin/adminSlice";
import { testSettingsReducer } from "client/test/test-settings/testSettingsSlice";
import { groupReducer } from "client/views/group/groupSlice";

export const combinedReducer = combineReducers({
  allGames: allGamesReducer,
  login: loginReducer,
  myGames: myGamesReducer,
  admin: adminReducer,
  testSettings: testSettingsReducer,
  group: groupReducer,
});

// Reducer to reset state
const rootReducer = (
  state: RootState | undefined,
  action: AnyAction,
): CombinedState<RootState> => {
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
        games: `Games count: ${state?.allGames?.games?.length}`,
        signups: `Signups count: ${state?.allGames?.signups?.length}`,
      },
      admin: {
        ...state?.admin,
        hiddenGames: `Hidden games count: ${state?.admin?.hiddenGames?.length}`,
        signupQuestions: `Signup questions count: ${state?.admin?.signupQuestions?.length}`,
        signupMessages: `Signup messages count: ${state?.admin?.signupMessages?.length}`,
      },
      myGames: {
        ...state?.myGames,
        enteredGames: state?.myGames?.enteredGames?.map((enteredGame) => ({
          ...enteredGame,
          gameDetails: enteredGame?.gameDetails?.gameId,
          message: "<Message hidden>",
        })),
        signedGames: state?.myGames?.signedGames?.map((signedGame) => ({
          ...signedGame,
          gameDetails: signedGame?.gameDetails?.gameId,
        })),
        favoritedGames: state?.myGames?.favoritedGames?.map(
          (favoritedGame) => favoritedGame?.gameId,
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
  enhancers: [sentryReduxEnhancer],
});
