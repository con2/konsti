import { postRegistration } from 'services/userServices';
import { submitLogin } from 'views/login/loginActions';
import { RegistrationFormFields } from 'typings/user.typings';
import { AppThunk } from 'typings/utils.typings';

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
      return await Promise.reject(registrationResponse);
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
