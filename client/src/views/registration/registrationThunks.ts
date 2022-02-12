import { postRegistration } from "client/services/userServices";
import { submitLogin } from "client/views/login/loginThunks";
import { RegistrationFormFields } from "shared/typings/api/login";
import { AppThunk } from "client/typings/redux.typings";

export const submitRegistration = (
  registrationFormFields: RegistrationFormFields
): AppThunk<Promise<string | undefined>> => {
  return async (dispatch): Promise<string | undefined> => {
    let registrationResponse;
    try {
      registrationResponse = await postRegistration(registrationFormFields);
    } catch (error) {
      return await Promise.reject(error);
    }

    if (registrationResponse?.status === "error") {
      switch (registrationResponse.code) {
        case 11:
          return "error.usernameTaken";
        case 12:
          return "error.invalidSerial";
        default:
          return "error.unknown";
      }
    }

    if (registrationResponse?.status === "success") {
      dispatch(
        submitLogin({
          username: registrationFormFields.username,
          password: registrationFormFields.password,
        })
      );
    }
  };
};
