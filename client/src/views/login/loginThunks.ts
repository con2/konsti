import { postLogin } from 'client/services/loginServices';
import { saveSession, clearSession } from 'client/utils/localStorage';
import { AppThunk } from 'client/typings/utils.typings';
import { ServerError } from 'shared/typings/api/errors';
import { LoginFormFields, PostLoginResponse } from 'shared/typings/api/login';
import { submitLoginAsync } from 'client/views/login/loginSlice';

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
