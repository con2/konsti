import { postLogin, postSessionRecovery } from "client/services/loginServices";
import { saveSession, clearSession } from "client/utils/localStorage";
import { AppThunk } from "client/typings/redux.typings";
import { ApiError } from "shared/typings/api/errors";
import { LoginFormFields, PostLoginResponse } from "shared/typings/api/login";
import { submitLoginAsync } from "client/views/login/loginSlice";
import { loadUser } from "client/utils/loadData";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";

export enum LoginErrorMessage {
  LOGIN_FAILED = "error.loginFailed",
  LOGIN_DISABLED = "error.loginDisabled",
  UNKNOWN = "error.unknown",
  EMPTY = "",
}

export const submitLogin = (
  loginFormFields: LoginFormFields
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    let loginResponse: PostLoginResponse | ApiError;
    try {
      loginResponse = await postLogin(loginFormFields);
    } catch (error) {
      clearSession();
      throw error;
    }

    if (loginResponse?.status === "error") {
      clearSession();

      switch (loginResponse.code) {
        case 21:
          return LoginErrorMessage.LOGIN_FAILED;
        case 22:
          return LoginErrorMessage.LOGIN_DISABLED;
        default:
          return LoginErrorMessage.UNKNOWN;
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
    }
  };
};

export const submitSessionRecovery = (jwt: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    let loginResponse: PostLoginResponse | ApiError;
    try {
      loginResponse = await postSessionRecovery(jwt);
    } catch (error) {
      clearSession();
      throw error;
    }

    if (loginResponse?.status === "error") {
      clearSession();

      switch (loginResponse.code) {
        case 21:
          throw new Error("error.loginFailed");
        case 22:
          throw new Error("error.loginDisabled");
        default:
          throw new Error(`error.unkown`);
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
    }
  };
};
