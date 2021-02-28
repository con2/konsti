import {
  createStore,
  combineReducers,
  applyMiddleware,
  CombinedState,
  AnyAction,
} from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { reducer as formReducer } from 'redux-form';
import { config } from 'client/config';
import { loadSession } from 'client/utils/localStorage';
import { RootState } from 'client/typings/redux.typings';
import { SUBMIT_LOGOUT } from 'client/typings/logoutActions.typings';

// Reducers
import { allGamesReducer } from 'client/views/all-games/allGamesReducer';
import { loginReducer } from 'client/views/login/loginReducer';
import { myGamesReducer } from 'client/views/my-games/myGamesReducer';
import { signupReducer } from 'client/views/signup/signupReducer';
import { adminReducer } from 'client/views/admin/adminReducer';
import { resultsReducer } from 'client/views/results/resultsReducer';

// Set reducers
export const appReducer = combineReducers({
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
  if (action.type !== SUBMIT_LOGOUT) return appReducer(state, action);

  const newState = appReducer(undefined, action);
  newState.admin = state.admin;
  newState.allGames = state.allGames;
  return newState;
};

const middlewares = applyMiddleware(thunk);

const composeEnhancers = composeWithDevTools({
  trace: config.reduxTrace,
  traceLimit: 25,
});

const enhancer = composeEnhancers(middlewares);

// Load persisted state from localStorage
const persistedState = loadSession();

// Create a Redux store object that holds the app state
// @ts-expect-error: Types of parameters 'state' and 'state' are incompatible
export const store = createStore(rootReducer, persistedState, enhancer);
