import { submitGetResults } from 'client/views/results/resultsThunks';
import { submitGetGames } from 'client/views/all-games/allGamesThunks';
import { submitGetSettings } from 'client/views/admin/adminThunks';
import { submitGetUser } from 'client/views/my-games/myGamesThunks';
import { submitGetGroup } from 'client/views/group/groupThunks';
import { submitLogin } from 'client/views/login/loginThunks';
import { store } from 'client/utils/store';
import { AppDispatch } from 'client/typings/redux.typings';

export const loadData = async (): Promise<void> => {
  // Get app settings
  await loadSettings();

  // Get games data
  await loadGames();

  // Check if existing user session
  await recoverSession();

  // Get assignment results
  await loadResults();

  // Get user data
  await loadUser();

  // Get group members
  await loadGroupMembers();
};

export const loadSettings = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetSettings());
};

export const loadGames = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetGames());
};

const recoverSession = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, jwt } = state.login;

  if (!loggedIn && jwt) {
    await dispatch(submitLogin({ jwt }));
  }
};

export const loadResults = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn } = state.login;
  const { signupTime } = state.admin;

  if (loggedIn && signupTime) {
    await dispatch(submitGetResults(signupTime));
  }
};

export const loadUser = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, userGroup, username } = state.login;

  if (loggedIn && userGroup === 'user') {
    await dispatch(submitGetUser(username));
  }
};

export const loadGroupMembers = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, groupCode } = state.login;

  if (loggedIn && groupCode !== '0') {
    await dispatch(submitGetGroup(groupCode));
  }
};
