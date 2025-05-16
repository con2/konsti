import {
  postKompassiLoginCallback,
  postVerifyKompassiLogin,
  postLogin,
  postSessionRecovery,
} from "client/services/loginServices";
import { saveSession, clearSession } from "client/utils/localStorage";
import { AppThunk } from "client/types/reduxTypes";
import {
  PostKompassiLoginError,
  PostKompassiLoginResponse,
  PostLoginError,
  PostLoginResponse,
} from "shared/types/api/login";
import {
  submitLoginAsync,
  submitUpdateEventLogItemsAsync,
  submitVerifyKompassiLoginAsync,
} from "client/views/login/loginSlice";
import { loadGroupMembers, loadUser } from "client/utils/loadData";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { LoginFormFields } from "client/views/login/components/LoginForm";
import { postEventLogItemIsSeen } from "client/services/userServices";
import { PostEventLogIsSeenRequest } from "shared/types/api/eventLog";

export enum LoginErrorMessage {
  LOGIN_FAILED = "error.loginFailed",
  LOGIN_DISABLED = "error.loginDisabled",
  INVALID_USER_GROUP = "error.invalidUserGroup",
  UNKNOWN = "error.unknown",
}

export const submitLogin = (
  loginFormFields: LoginFormFields,
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    let loginResponse: PostLoginResponse | PostLoginError;
    try {
      loginResponse = await postLogin(loginFormFields);
    } catch (error) {
      clearSession();
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw error;
    }

    if (loginResponse.status === "error") {
      clearSession();

      switch (loginResponse.errorId) {
        case "loginFailed":
          return LoginErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return LoginErrorMessage.LOGIN_DISABLED;
        case "unknown":
          return LoginErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    saveSession({
      login: { jwt: loginResponse.jwt },
    });

    dispatch(
      submitLoginAsync({
        loggedIn: true,
        username: loginResponse.username,
        jwt: loginResponse.jwt,
        userGroup: loginResponse.userGroup,
        serial: loginResponse.serial,
        eventLogItems: loginResponse.eventLogItems,
        kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
        kompassiId: loginResponse.kompassiId,
      }),
    );

    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: loginResponse.groupCode,
        isGroupCreator: loginResponse.groupCreatorCode !== "0",
      }),
    );

    // TODO: Remove these, backend response should return all required data
    await loadUser();
    await loadGroupMembers();
  };
};

export const submitSessionRecovery = (jwt: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    let loginResponse: PostLoginResponse | PostLoginError;
    try {
      loginResponse = await postSessionRecovery(jwt);
    } catch (error) {
      clearSession();
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw error;
    }

    if (loginResponse.status === "error") {
      clearSession();

      switch (loginResponse.errorId) {
        case "loginFailed":
          // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
          throw new Error("error.loginFailed");
        case "loginDisabled":
          // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
          throw new Error("error.loginDisabled");
        case "unknown":
          // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
          throw new Error("error.unknown");
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    saveSession({
      login: { jwt: loginResponse.jwt },
    });

    dispatch(
      submitLoginAsync({
        loggedIn: true,
        username: loginResponse.username,
        jwt: loginResponse.jwt,
        userGroup: loginResponse.userGroup,
        serial: loginResponse.serial,
        eventLogItems: loginResponse.eventLogItems,
        kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
        kompassiId: loginResponse.kompassiId,
      }),
    );

    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: loginResponse.groupCode,
        isGroupCreator: loginResponse.groupCreatorCode !== "0",
      }),
    );
  };
};

export const submitUpdateEventLogIsSeen = (
  request: PostEventLogIsSeenRequest,
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postEventLogItemIsSeen(request);

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(submitUpdateEventLogItemsAsync(response.eventLogItems));
    }
  };
};

export const submitKompassiLogin = (
  code: string,
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    let loginResponse: PostKompassiLoginResponse | PostKompassiLoginError;
    try {
      loginResponse = await postKompassiLoginCallback(code);
    } catch (error) {
      clearSession();
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw error;
    }

    if (loginResponse.status === "error") {
      clearSession();

      switch (loginResponse.errorId) {
        case "loginFailed":
          return LoginErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return LoginErrorMessage.LOGIN_DISABLED;
        case "invalidUserGroup":
          return LoginErrorMessage.INVALID_USER_GROUP;
        case "unknown":
          return LoginErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    saveSession({
      login: { jwt: loginResponse.jwt },
    });

    dispatch(
      submitLoginAsync({
        loggedIn: true,
        username: loginResponse.username,
        jwt: loginResponse.jwt,
        userGroup: loginResponse.userGroup,
        serial: loginResponse.serial,
        eventLogItems: loginResponse.eventLogItems,
        kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
        kompassiId: loginResponse.kompassiId,
      }),
    );

    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: loginResponse.groupCode,
        isGroupCreator: loginResponse.groupCreatorCode !== "0",
      }),
    );

    // TODO: Remove these, backend response should return all required data
    await loadUser();
    await loadGroupMembers();
  };
};

export enum KompassiVerifyErrorMessage {
  USERNAME_TAKEN = "error.usernameTaken",
  UNKNOWN = "error.unknown",
}

export const submitVerifyKompassiLogin = (
  username: string,
): AppThunk<Promise<KompassiVerifyErrorMessage | undefined>> => {
  return async (dispatch): Promise<KompassiVerifyErrorMessage | undefined> => {
    const response = await postVerifyKompassiLogin(username);

    if (response.status === "error") {
      switch (response.errorId) {
        case "usernameNotFree":
          return KompassiVerifyErrorMessage.USERNAME_TAKEN;
        case "unknown":
          return KompassiVerifyErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(response.errorId);
      }
    }

    dispatch(
      submitVerifyKompassiLoginAsync({
        username: response.username,
        kompassiUsernameAccepted: response.kompassiUsernameAccepted,
        jwt: response.jwt,
      }),
    );

    await dispatch(submitSessionRecovery(response.jwt));
  };
};
