import { postRegistration } from "client/services/userServices";
import { submitLogin } from "client/views/login/loginThunks";
import { RegistrationFormFields } from "shared/typings/api/login";
import { AppThunk } from "client/typings/redux.typings";

export enum RegistrationErrorMessage {
  USERNAME_TAKEN = "error.usernameTaken",
  INVALID_SERIAL = "error.invalidSerial",
  UNKNOWN = "error.unknown",
  EMPTY = "",
}

export const submitRegistration = (
  registrationFormFields: RegistrationFormFields
): AppThunk<Promise<RegistrationErrorMessage | undefined>> => {
  return async (dispatch): Promise<RegistrationErrorMessage | undefined> => {
    let registrationResponse;
    try {
      registrationResponse = await postRegistration(registrationFormFields);
    } catch (error) {
      return await Promise.reject(error);
    }

    if (registrationResponse?.status === "error") {
      switch (registrationResponse.code) {
        case 11:
          return RegistrationErrorMessage.USERNAME_TAKEN;
        case 12:
          return RegistrationErrorMessage.INVALID_SERIAL;
        default:
          return RegistrationErrorMessage.UNKNOWN;
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
