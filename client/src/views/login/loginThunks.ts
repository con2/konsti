import { isDeepEqual } from "remeda";
import {
  postKompassiLoginCallback,
  postVerifyKompassiLogin,
  postLogin,
  postSessionRecovery,
  postUpdateUserEmailAddress,
} from "client/services/loginServices";
import { saveSession, clearSession } from "client/utils/localStorage";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitFinalizeLoginAsync,
  submitLoginAsync,
  submitUpdateEventLogItemsAsync,
  submitVerifyKompassiLoginAsync,
} from "client/views/login/loginSlice";
import { loadGroupMembers, loadUser } from "client/utils/loadData";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { LoginFormFields } from "client/views/login/components/LocalLoginForm";
import { postEventLogItemIsSeen } from "client/services/userServices";
import { PostEventLogIsSeenRequest } from "shared/types/api/eventLog";

export enum LoginErrorMessage {
  LOGIN_FAILED = "error.loginFailed",
  LOGIN_DISABLED = "error.loginDisabled",
  INVALID_USER_GROUP = "error.invalidUserGroup",
  UNKNOWN = "error.unknown",
}

export const submitLogin = (
  loginFormFields: LoginFormFields,
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    const loginResponse = await postLogin(loginFormFields);

    if (loginResponse.status === "error") {
      switch (loginResponse.errorId) {
        case "loginFailed":
          return LoginErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return LoginErrorMessage.LOGIN_DISABLED;
        case "unknown":
          return LoginErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

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
        eventLogItems: loginResponse.eventLogItems,
        kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
        kompassiId: loginResponse.kompassiId,
        email: loginResponse.email,
        emailNotificationPermitAsked:
          loginResponse.emailNotificationPermitAsked,
      }),
    );

    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: loginResponse.groupCode,
        isGroupCreator: loginResponse.groupCreatorCode !== "0",
      }),
    );

    // TODO: Remove these, backend response should return all required data
    await loadUser();
    await loadGroupMembers();
  };
};

enum SubmitSessionRecoveryErrorMessage {
  LOGIN_FAILED = "error.loginFailed",
  LOGIN_DISABLED = "error.loginDisabled",
  UNKNOWN = "error.unknown",
}

export const submitSessionRecovery = (
  currentJwt: string,
): AppThunk<Promise<SubmitSessionRecoveryErrorMessage | undefined>> => {
  return async (
    dispatch,
    useState,
  ): Promise<SubmitSessionRecoveryErrorMessage | undefined> => {
    const loginResponse = await postSessionRecovery(currentJwt);

    if (loginResponse.status === "error") {
      clearSession();

      // TODO: Show "session expired" error
      switch (loginResponse.errorId) {
        case "loginFailed":
          return SubmitSessionRecoveryErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return SubmitSessionRecoveryErrorMessage.LOGIN_DISABLED;
        case "unknown":
          return SubmitSessionRecoveryErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

    saveSession({
      login: { jwt: loginResponse.jwt },
    });

    const state = useState();

    const updatedLogin = {
      loggedIn: true,
      username: loginResponse.username,
      jwt: loginResponse.jwt,
      userGroup: loginResponse.userGroup,
      serial: loginResponse.serial,
      eventLogItems: loginResponse.eventLogItems,
      kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
      kompassiId: loginResponse.kompassiId,
      email: loginResponse.email,
      emailNotificationPermitAsked: loginResponse.emailNotificationPermitAsked,
    };

    if (!isDeepEqual(state.login, updatedLogin)) {
      dispatch(submitLoginAsync(updatedLogin));
    }

    const currentGroup = {
      groupCode: state.group.groupCode,
      isGroupCreator: state.group.isGroupCreator,
    };

    const updatedGroup = {
      groupCode: loginResponse.groupCode,
      isGroupCreator: loginResponse.groupCreatorCode !== "0",
    };

    if (!isDeepEqual(currentGroup, updatedGroup)) {
      dispatch(submitUpdateGroupCodeAsync(updatedGroup));
    }
  };
};

export const submitUpdateEventLogIsSeen = (
  request: PostEventLogIsSeenRequest,
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postEventLogItemIsSeen(request);

    if (response.status === "error") {
      return;
    }

    dispatch(submitUpdateEventLogItemsAsync(response.eventLogItems));
  };
};

export const submitKompassiLogin = (
  code: string,
): AppThunk<Promise<LoginErrorMessage | undefined>> => {
  return async (dispatch): Promise<LoginErrorMessage | undefined> => {
    const loginResponse = await postKompassiLoginCallback(code);

    if (loginResponse.status === "error") {
      switch (loginResponse.errorId) {
        case "loginFailed":
          return LoginErrorMessage.LOGIN_FAILED;
        case "loginDisabled":
          return LoginErrorMessage.LOGIN_DISABLED;
        case "invalidUserGroup":
          return LoginErrorMessage.INVALID_USER_GROUP;
        case "unknown":
          return LoginErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(loginResponse.errorId);
      }
    }

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
        eventLogItems: loginResponse.eventLogItems,
        kompassiUsernameAccepted: loginResponse.kompassiUsernameAccepted,
        kompassiId: loginResponse.kompassiId,
        email: loginResponse.email,
        emailNotificationPermitAsked:
          loginResponse.emailNotificationPermitAsked,
      }),
    );

    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: loginResponse.groupCode,
        isGroupCreator: loginResponse.groupCreatorCode !== "0",
      }),
    );

    // TODO: Remove these, backend response should return all required data
    await loadUser();
    await loadGroupMembers();
  };
};

export enum KompassiVerifyErrorMessage {
  USERNAME_TAKEN = "error.usernameTaken",
  UNKNOWN = "error.unknown",
}

export enum UpdateUserEmailAddressErrorMessage {
  UNKNOWN = "error.unknown",
  INVALID_EMAIL = "validation.invalidEmail",
}

export const submitVerifyKompassiLogin = (
  username: string,
): AppThunk<Promise<KompassiVerifyErrorMessage | undefined>> => {
  return async (dispatch): Promise<KompassiVerifyErrorMessage | undefined> => {
    const response = await postVerifyKompassiLogin(username);

    if (response.status === "error") {
      switch (response.errorId) {
        case "usernameNotFree":
          return KompassiVerifyErrorMessage.USERNAME_TAKEN;
        case "unknown":
          return KompassiVerifyErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(response.errorId);
      }
    }

    dispatch(
      submitVerifyKompassiLoginAsync({
        username: response.username,
        kompassiUsernameAccepted: response.kompassiUsernameAccepted,
        jwt: response.jwt,
      }),
    );

    await dispatch(submitSessionRecovery(response.jwt));
  };
};

export const submitFinalizeLogin = (
  email: string,
): AppThunk<Promise<UpdateUserEmailAddressErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<UpdateUserEmailAddressErrorMessage | undefined> => {
    const updateEmailResponse = await postUpdateUserEmailAddress(email);

    if (updateEmailResponse.status === "error") {
      switch (updateEmailResponse.errorId) {
        case "unknown":
          return UpdateUserEmailAddressErrorMessage.UNKNOWN;
        case "invalidEmail":
          return UpdateUserEmailAddressErrorMessage.INVALID_EMAIL;
        default:
          return exhaustiveSwitchGuard(updateEmailResponse.errorId);
      }
    }

    dispatch(
      submitFinalizeLoginAsync({
        email: updateEmailResponse.email,
        emailNotificationPermitAsked:
          updateEmailResponse.emailNotificationPermitAsked,
        jwt: updateEmailResponse.jwt,
      }),
    );

    await dispatch(submitSessionRecovery(updateEmailResponse.jwt));
  };
};

export const submitUpdateUserEmailAddress = (
  email: string,
): AppThunk<Promise<UpdateUserEmailAddressErrorMessage | null>> => {
  return async (
    dispatch,
  ): Promise<UpdateUserEmailAddressErrorMessage | null> => {
    const updateEmailResponse = await postUpdateUserEmailAddress(email);

    if (updateEmailResponse.status === "error") {
      switch (updateEmailResponse.errorId) {
        case "unknown":
          return UpdateUserEmailAddressErrorMessage.UNKNOWN;
        case "invalidEmail":
          return UpdateUserEmailAddressErrorMessage.INVALID_EMAIL;
        default:
          return exhaustiveSwitchGuard(updateEmailResponse.errorId);
      }
    }

    dispatch(
      submitFinalizeLoginAsync({
        email: updateEmailResponse.email,
        emailNotificationPermitAsked:
          updateEmailResponse.emailNotificationPermitAsked,
        jwt: updateEmailResponse.jwt,
      }),
    );

    await dispatch(submitSessionRecovery(updateEmailResponse.jwt));
    return null;
  };
};
