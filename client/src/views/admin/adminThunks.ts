import { postHidden } from "client/services/hiddenServices";
import {
  deleteSignupQuestion,
  getSettings,
  postSignupQuestion,
  postSettings,
} from "client/services/settingsServices";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitToggleAppOpenAsync,
  updateSignupQuestions,
  submitSetSignupStrategyAsync,
  submitGetSignupMessagesAsync,
  submitAssignmentResponseMessageAsync,
  submitSetLoginProviderAsync,
} from "client/views/admin/adminSlice";
import { SignupQuestion } from "shared/types/models/settings";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { getSignupMessages } from "client/services/userServices";
import { getSentryTest } from "client/views/admin/adminService";
import { postAssignment } from "client/services/assignmentServices";

export const submitUpdateHidden = (
  hiddenProgramItemIds: readonly string[],
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateHiddenResponse = await postHidden(hiddenProgramItemIds);

    if (updateHiddenResponse.status === "error") {
      // TODO
    }

    if (updateHiddenResponse.status === "success") {
      dispatch(
        submitUpdateHiddenAsync(updateHiddenResponse.hiddenProgramItemIds),
      );
    }
  };
};

export const submitGetSettings = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const settingsResponse = await getSettings();

    if (settingsResponse.status === "error") {
      // TODO
    }

    if (settingsResponse.status === "success") {
      dispatch(
        submitGetSettingsAsync({
          hiddenProgramItemIds: settingsResponse.hiddenProgramItemIds,
          appOpen: settingsResponse.appOpen,
          signupQuestions: settingsResponse.signupQuestions,
          signupStrategy: settingsResponse.signupStrategy,
          loginProvider: settingsResponse.loginProvider,
        }),
      );
    }
  };
};

export const submitToggleAppOpen = (appOpen: boolean): AppThunk => {
  return async (dispatch): Promise<void> => {
    const postSettingsResponse = await postSettings({ appOpen });

    if (postSettingsResponse.status === "error") {
      // TODO
    }

    if (postSettingsResponse.status === "success") {
      dispatch(submitToggleAppOpenAsync(postSettingsResponse.settings.appOpen));
    }
  };
};

export const submitAddSignupQuestion = (
  signupQuestion: SignupQuestion,
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSignupQuestion({
      programItemId: signupQuestion.programItemId,
      questionFi: signupQuestion.questionFi,
      questionEn: signupQuestion.questionEn,
      private: signupQuestion.private,
      type: signupQuestion.type,
      selectOptions: signupQuestion.selectOptions,
    });

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(updateSignupQuestions(response.signupQuestions));
    }
  };
};

export const submitDeleteSignupQuestion = (programItemId: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await deleteSignupQuestion(programItemId);

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(updateSignupQuestions(response.signupQuestions));
    }
  };
};

export const submitSetSignupStrategy = (
  signupStrategy: EventSignupStrategy,
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSettings({ signupStrategy });

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(submitSetSignupStrategyAsync(response.settings.signupStrategy));
    }
  };
};

export const submitGetSignupMessages = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await getSignupMessages();

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(submitGetSignupMessagesAsync(response.signupMessages));
    }
  };
};

export const submitGetSentryTest = (): AppThunk => {
  return async (_dispatch): Promise<void> => {
    await getSentryTest();
  };
};

export const submitAssignment = (
  assignmentTime: string,
): AppThunk<Promise<string | undefined>> => {
  return async (dispatch): Promise<string | undefined> => {
    const assignResponse = await postAssignment(assignmentTime);

    if (assignResponse.status === "error") {
      return assignResponse.message;
    }

    dispatch(
      submitAssignmentResponseMessageAsync(assignResponse.resultMessage),
    );
  };
};

export const submitSetLoginProvider = (
  loginProvider: LoginProvider,
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSettings({ loginProvider });

    if (response.status === "error") {
      // TODO
    }

    if (response.status === "success") {
      dispatch(submitSetLoginProviderAsync(response.settings.loginProvider));
    }
  };
};
