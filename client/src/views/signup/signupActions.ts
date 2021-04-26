import { postSignup } from 'client/services/signupServices';
import { SignupData } from 'client/typings/user.typings';
import { AppThunk } from 'client/typings/utils.typings';
import {
  SubmitSignupAsync,
  SubmitSignupTime,
  SubmitSelectedGames,
  UpdateUnsavedChangesStatus,
  SUBMIT_SIGNUP_TIME,
  SUBMIT_SELECTED_GAMES,
  UPDATE_UNSAVED_CHANGES_STATUS,
  SUBMIT_SIGNED_GAMES,
} from 'client/typings/signupActions.typings';
import { SelectedGame } from 'shared/typings/models/user';

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
  signedGames: readonly SelectedGame[]
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
  selectedGames: readonly SelectedGame[]
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
