import { combineReducers, CombinedState, AnyAction } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { config } from "client/config";
import { loadSession } from "client/utils/localStorage";
import { RootState } from "client/typings/redux.typings";
import { SUBMIT_LOGOUT } from "client/typings/logoutActions.typings";

// Reducers
import { allGamesReducer } from "client/views/all-games/allGamesSlice";
import { loginReducer } from "client/views/login/loginSlice";
import { myGamesReducer } from "client/views/my-games/myGamesSlice";
import { signupReducer } from "client/views/signup/signupSlice";
import { adminReducer } from "client/views/admin/adminSlice";
import { resultsReducer } from "client/views/results/resultsSlice";
import { testSettingsReducer } from "client/test/test-settings/testSettingsSlice";

export const combinedReducer = combineReducers({
  allGames: allGamesReducer,
  login: loginReducer,
  myGames: myGamesReducer,
  signup: signupReducer,
  admin: adminReducer,
  results: resultsReducer,
  testSettings: testSettingsReducer,
});

// Reducer to reset state
const rootReducer = (
  state: RootState | undefined,
  action: AnyAction
): CombinedState<RootState> => {
  if (action.type === SUBMIT_LOGOUT) {
    const newState = combinedReducer(undefined, action);

    if (state?.admin) {
      newState.admin = state.admin;
    }

    if (state?.allGames) {
      newState.allGames = state.allGames;
    }

    return newState;
  }

  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadSession(), // Load persisted state from localStorage
  devTools:
    process.env.SETTINGS !== "production"
      ? {
          trace: config.enableReduxTrace,
          traceLimit: 25,
        }
      : false,
});
