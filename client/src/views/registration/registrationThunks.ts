import { postRegistration } from 'client/services/userServices';
import { submitLogin } from 'client/views/login/loginThunks';
import { RegistrationFormFields } from 'shared/typings/api/login';
import { AppThunk } from 'client/typings/redux.typings';

export const submitRegistration = (
  registrationFormFields: RegistrationFormFields
): AppThunk => {
  return async (dispatch): Promise<void> => {
    let registrationResponse;
    try {
      registrationResponse = await postRegistration(registrationFormFields);
    } catch (error) {
      return await Promise.reject(error);
    }

    if (registrationResponse?.status === 'error') {
      switch (registrationResponse.code) {
        case 11:
          throw new Error('error.usernameTaken');
        case 12:
          throw new Error('error.invalidSerial');
        default:
          throw new Error('error.unknown');
      }
    }

    if (registrationResponse?.status === 'success') {
      dispatch(
        submitLogin({
          username: registrationFormFields.username,
          password: registrationFormFields.password,
        })
      );
    }
  };
};
