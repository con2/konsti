import { combineReducers, CombinedState, AnyAction } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { configureStore } from '@reduxjs/toolkit';
import { config } from 'client/config';
import { loadSession } from 'client/utils/localStorage';
import { RootState } from 'client/typings/redux.typings';
import { SUBMIT_LOGOUT } from 'client/typings/logoutActions.typings';

// Reducers
import { allGamesReducer } from 'client/views/all-games/allGamesSlice';
import { loginReducer } from 'client/views/login/loginSlice';
import { myGamesReducer } from 'client/views/my-games/myGamesSlice';
import { signupReducer } from 'client/views/signup/signupSlice';
import { adminReducer } from 'client/views/admin/adminSlice';
import { resultsReducer } from 'client/views/results/resultsSlice';

export const combinedReducer = combineReducers({
  form: formReducer,
  allGames: allGamesReducer,
  login: loginReducer,
  myGames: myGamesReducer,
  signup: signupReducer,
  admin: adminReducer,
  results: resultsReducer,
});

// Reducer to reset state
const rootReducer = (
  state: RootState,
  action: AnyAction
): CombinedState<RootState> => {
  if (action.type !== SUBMIT_LOGOUT) return combinedReducer(state, action);

  const newState = combinedReducer(undefined, action);
  newState.admin = state.admin;
  newState.allGames = state.allGames;
  return newState;
};

export const store = configureStore({
  // @ts-expect-error: TODO
  reducer: rootReducer,
  // @ts-expect-error: TODO
  preloadedState: loadSession(), // Load persisted state from localStorage
  devTools: {
    trace: config.enableReduxTrace,
    traceLimit: 25,
  },
});
