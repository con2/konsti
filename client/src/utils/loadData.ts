import { config } from "shared/config";
import { UserGroup } from "shared/types/models/user";
import { submitGetTestSettings } from "client/test/test-settings/testSettingsThunks";
import { AppDispatch } from "client/types/reduxTypes";
import { store } from "client/utils/store";
import {
  submitGetSettings,
  submitGetSignupMessages,
} from "client/views/admin/adminThunks";
import { submitGetProgramItems } from "client/views/all-program-items/allProgramItemsThunks";
import { submitGetGroup } from "client/views/group/groupThunks";
import { submitSessionRecovery } from "client/views/login/loginThunks";
import { submitGetUser } from "client/views/my-program-items/myProgramItemsThunks";

// Returns whether every load that actually ran succeeded, so the caller can
// tell a load that delivered fresh data from one whose requests failed.
// Requests made here must be registered in the error-display policy's
// background-request list, or their failures around a device wake toast
// immediately instead of being suppressed.
export const loadData = async (): Promise<boolean> => {
  // Get app settings
  let success = await loadSettings();

  // Get test settings
  if (process.env.SETTINGS !== "production" && config.client().showTestValues) {
    success = (await loadTestSettings()) && success;
  }

  // Check if existing user session
  success = (await recoverSession()) && success;

  // Get user data
  success = (await loadUser()) && success;

  // Get program items data
  // Must be loaded after user to be able to access state.login
  success = (await loadProgramItems({ forceUpdate: false })) && success;

  // Get group members
  success = (await loadGroupMembers()) && success;

  return success;
};

export const loadSettings = async (): Promise<boolean> => {
  const dispatch: AppDispatch = store.dispatch;
  return await dispatch(submitGetSettings());
};

const loadTestSettings = async (): Promise<boolean> => {
  const dispatch: AppDispatch = store.dispatch;
  return await dispatch(submitGetTestSettings());
};

export const loadProgramItems = async ({
  forceUpdate,
}: {
  forceUpdate: boolean;
}): Promise<boolean> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { appOpen } = state.admin;
  const { loggedIn } = state.login;

  if (!appOpen && !loggedIn) {
    return true;
  }

  return await dispatch(submitGetProgramItems({ forceUpdate }));
};

const recoverSession = async (): Promise<boolean> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, jwt } = state.login;

  if (!loggedIn && jwt) {
    const error = await dispatch(submitSessionRecovery(jwt));
    if (error) {
      // A rejected session raises its own app-level error, so there is nothing
      // to report here beyond the load having failed
      return false;
    }
  }
  return true;
};

export const loadUser = async (): Promise<boolean> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn, userGroup, username } = state.login;

  if (loggedIn && userGroup === UserGroup.USER) {
    return await dispatch(submitGetUser(username));
  }
  return true;
};

export const loadGroupMembers = async (): Promise<boolean> => {
  const state = store.getState();
  const dispatch: AppDispatch = store.dispatch;
  const { loggedIn } = state.login;
  const { groupCode } = state.group;

  if (loggedIn && groupCode !== "0") {
    const error = await dispatch(submitGetGroup(groupCode));
    return error === undefined;
  }
  return true;
};

// This includes public and private sign-up messages
export const loadSignupMessages = async (): Promise<void> => {
  const dispatch: AppDispatch = store.dispatch;
  await dispatch(submitGetSignupMessages());
};
