import { postRegistration } from "client/services/userServices";
import { submitLogin } from "client/views/login/loginThunks";
import { RegistrationFormFields } from "client/views/registration/components/RegistrationForm";
import { AppThunk } from "client/types/reduxTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export enum RegistrationErrorMessage {
  USERNAME_TAKEN = "error.usernameTaken",
  INVALID_SERIAL = "error.invalidSerial",
  UNKNOWN = "error.unknown",
}

export const submitRegistration = (
  registrationFormFields: RegistrationFormFields,
): AppThunk<Promise<RegistrationErrorMessage | undefined>> => {
  return async (dispatch): Promise<RegistrationErrorMessage | undefined> => {
    const registrationResponse = await postRegistration(registrationFormFields);

    if (registrationResponse.status === "error") {
      switch (registrationResponse.errorId) {
        case "usernameNotFree":
          return RegistrationErrorMessage.USERNAME_TAKEN;
        case "invalidSerial":
          return RegistrationErrorMessage.INVALID_SERIAL;
        case "unknown":
          return RegistrationErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(registrationResponse.errorId);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispatch(
      submitLogin({
        username: registrationFormFields.username,
        password: registrationFormFields.password,
      }),
    );
  };
};
