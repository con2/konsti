import { postLogin, postSessionRecovery } from "client/services/loginServices";
import { saveSession, clearSession } from "client/utils/localStorage";
import { AppThunk } from "client/typings/redux.typings";
import { ServerError } from "shared/typings/api/errors";
import { LoginFormFields, PostLoginResponse } from "shared/typings/api/login";
import { submitLoginAsync } from "client/views/login/loginSlice";
import { loadUser } from "client/utils/loadData";

export const submitLogin = (
  loginFormFields: LoginFormFields
): AppThunk<Promise<string | undefined>> => {
  return async (dispatch): Promise<string | undefined> => {
    let loginResponse: PostLoginResponse | ServerError;
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
          return "error.loginFailed";
        case 22:
          return "error.loginDisabled";
        default:
          return `error.unkown`;
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
          groupCode: loginResponse.groupCode,
        })
      );

      await loadUser();
    }
  };
};

export const submitSessionRecovery = (jwt: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    let loginResponse: PostLoginResponse | ServerError;
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
          groupCode: loginResponse.groupCode,
        })
      );

      await loadUser();
    }
  };
};
