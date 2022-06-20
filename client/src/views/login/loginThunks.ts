import { postLogin, postSessionRecovery } from "client/services/loginServices";
import { saveSession, clearSession } from "client/utils/localStorage";
import { AppThunk } from "client/typings/redux.typings";
import {
  LoginFormFields,
  PostLoginError,
  PostLoginResponse,
} from "shared/typings/api/login";
import { submitLoginAsync } from "client/views/login/loginSlice";
import { loadGroupMembers, loadUser } from "client/utils/loadData";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export enum LoginErrorMessage {
  LOGIN_FAILED = "error.loginFailed",
  LOGIN_DISABLED = "error.loginDisabled",
  UNKNOWN = "error.unknown",
}

export const submitLogin = (
  loginFormFields: LoginFormFields
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    let loginResponse: PostLoginResponse | PostLoginError;
    try {
      loginResponse = await postLogin(loginFormFields);
    } catch (error) {
      clearSession();
      throw error;
    }

    if (loginResponse?.status === "error") {
      clearSession();

      switch (loginResponse.errorId) {
        case "loginFailed":
          return LoginErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return LoginErrorMessage.LOGIN_DISABLED;
        case "unknown":
          return LoginErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    if (loginResponse?.status === "success") {
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
        })
      );

      dispatch(submitUpdateGroupCodeAsync(loginResponse.groupCode));

      await loadUser();
      await loadGroupMembers();
    }
  };
};

export const submitSessionRecovery = (jwt: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    let loginResponse: PostLoginResponse | PostLoginError;
    try {
      loginResponse = await postSessionRecovery(jwt);
    } catch (error) {
      clearSession();
      throw error;
    }

    if (loginResponse?.status === "error") {
      clearSession();

      switch (loginResponse.errorId) {
        case "loginFailed":
          throw new Error("error.loginFailed");
        case "loginDisabled":
          throw new Error("error.loginDisabled");
        case "unknown":
          throw new Error(`error.unknown`);
        default:
          exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    if (loginResponse?.status === "success") {
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
        })
      );

      dispatch(submitUpdateGroupCodeAsync(loginResponse.groupCode));
    }
  };
};
