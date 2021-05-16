import { postSignup } from 'client/services/signupServices';
import { AppThunk } from 'client/typings/redux.typings';
import { SignupData } from 'shared/typings/api/signup';
import { submitSignupAsync } from 'client/views/my-games/myGamesSlice';
import { submitSelectedGames } from 'client/views/signup/signupSlice';

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
