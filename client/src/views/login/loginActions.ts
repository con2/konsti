import { postLogin } from 'services/loginServices';
import { saveSession, clearSession } from 'utils/localStorage';
import {
  LoginFormFields,
  LoginData,
  PostLoginResponse,
} from 'typings/user.typings';
import { ServerError, AppThunk } from 'typings/utils.typings';
import { SubmitLoginAsync, SUBMIT_LOGIN } from 'typings/loginActions.typings';

export const submitLogin = (loginFormFields: LoginFormFields): AppThunk => {
  return async (dispatch): Promise<void> => {
    let loginResponse: PostLoginResponse | ServerError;
    try {
      loginResponse = await postLogin(loginFormFields);
    } catch (error) {
      clearSession();
      throw error;
    }

    if (loginResponse?.status === 'error') {
      clearSession();
      return await Promise.reject(loginResponse);
    }

    if (loginResponse?.status === 'success') {
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
    }
  };
};

const submitLoginAsync = ({
  username,
  loggedIn,
  jwt,
  userGroup,
  serial,
  groupCode,
}: LoginData): SubmitLoginAsync => {
  return {
    type: SUBMIT_LOGIN,
    username,
    loggedIn,
    jwt,
    userGroup,
    serial,
    groupCode,
  };
};
