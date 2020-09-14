import {
  createStore,
  combineReducers,
  applyMiddleware,
  CombinedState,
  AnyAction,
} from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { config } from 'config';
import { loadSession } from 'utils/localStorage';
import { RootState } from 'typings/redux.typings';
import { SUBMIT_LOGOUT } from 'typings/logoutActions.typings';

// Reducers
import { reducer as formReducer } from 'redux-form';
import { allGamesReducer } from 'views/all-games/allGamesReducer';
import { loginReducer } from 'views/login/loginReducer';
import { myGamesReducer } from 'views/my-games/myGamesReducer';
import { signupReducer } from 'views/signup/signupReducer';
import { adminReducer } from 'views/admin/adminReducer';
import { resultsReducer } from 'views/results/resultsReducer';

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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const store = createStore(rootReducer, persistedState, enhancer);
