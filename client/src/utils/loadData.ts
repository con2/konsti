import { submitGetGames } from "client/views/all-games/allGamesThunks";
import {
  submitGetSettings,
  submitGetSignupMessages,
} from "client/views/admin/adminThunks";
import { submitGetUser } from "client/views/my-games/myGamesThunks";
import { submitGetGroup } from "client/views/group/groupThunks";
import { submitSessionRecovery } from "client/views/login/loginThunks";
import { store } from "client/utils/store";
import { AppDispatch } from "client/typings/redux.typings";
import { submitGetTestSettings } from "client/test/test-settings/testSettingsThunks";

export const loadData = async (): Promise<void> => {
  // Get app settings
  await loadSettings();

  // Get test settings
  if (process.env.SETTINGS !== "production") {
    await loadTestSettings();
  }

  // Get games data
  await loadGames();

  // Check if existing user session
  await recoverSession();

  // Get user data
  await loadUser();

  // Get group members
  await loadGroupMembers();
};

export const loadSettings = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetSettings());
};

const loadTestSettings = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetTestSettings());
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
    try {
      await dispatch(submitSessionRecovery(jwt));
    } catch (error) {
      console.log(`Error loading saved session, reset session...`); // eslint-disable-line no-console
    }
  }
};

export const loadUser = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, userGroup, username } = state.login;

  if (loggedIn && userGroup === "user") {
    await dispatch(submitGetUser(username));
  }
};

export const loadGroupMembers = async (): Promise<void> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn } = state.login;
  const { groupCode } = state.group;

  if (loggedIn && groupCode !== "0") {
    await dispatch(submitGetGroup(groupCode));
  }
};

export const loadSignupMessages = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetSignupMessages());
};
