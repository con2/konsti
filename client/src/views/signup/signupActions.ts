import { postSignup } from 'services/signupServices';
import { Signup, SignupData } from 'typings/user.typings';
import { AppThunk } from 'typings/utils.typings';
import {
  SubmitSignupAsync,
  SubmitSignupTime,
  SubmitSelectedGames,
  UpdateUnsavedChangesStatus,
  SUBMIT_SIGNUP_TIME,
  SUBMIT_SELECTED_GAMES,
  UPDATE_UNSAVED_CHANGES_STATUS,
  SUBMIT_SIGNED_GAMES,
} from 'typings/signupActions.typings';

export const submitSignup = (signupData: SignupData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const signupResponse = await postSignup(signupData);

    if (signupResponse?.status === 'error') {
      return await Promise.reject(signupResponse);
    }

    if (signupResponse?.status === 'success') {
      dispatch(submitSignupAsync(signupResponse.signedGames));
      dispatch(submitSelectedGames(signupResponse.signedGames));
    }
  };
};

const submitSignupAsync = (
  signedGames: readonly Signup[]
): SubmitSignupAsync => {
  return {
    type: SUBMIT_SIGNED_GAMES,
    signedGames,
  };
};

export const submitSignupTime = (signupTime: string): SubmitSignupTime => {
  return {
    type: SUBMIT_SIGNUP_TIME,
    signupTime,
  };
};

export const submitSelectedGames = (
  selectedGames: readonly Signup[]
): SubmitSelectedGames => {
  return {
    type: SUBMIT_SELECTED_GAMES,
    selectedGames,
  };
};

export const updateUnsavedChangesStatus = (
  status: boolean
): UpdateUnsavedChangesStatus => {
  return {
    type: UPDATE_UNSAVED_CHANGES_STATUS,
    unsavedChanges: status,
  };
};
