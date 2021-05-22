import {
  deleteEnteredGame,
  postEnteredGame,
  postSignup,
} from 'client/services/signupServices';
import { AppThunk } from 'client/typings/redux.typings';
import {
  DeleteEnteredGameParameters,
  PostEnteredGameParameters,
  SignupData,
} from 'shared/typings/api/signup';
import {
  submitSignupAsync,
  submitEnteredAsync,
  submitDeleteEnteredAsync,
} from 'client/views/my-games/myGamesSlice';
import { submitSelectedGames } from 'client/views/signup/signupSlice';
import { SelectedGame } from 'shared/typings/models/user';

export const submitEnterGame = (
  data: PostEnteredGameParameters,
  game: SelectedGame
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const signupResponse = await postEnteredGame(data);

    if (signupResponse?.status === 'error') {
      return await Promise.reject(signupResponse);
    }

    if (signupResponse?.status === 'success') {
      dispatch(submitEnteredAsync(game));
    }
  };
};

export const submitDeleteGame = (
  data: DeleteEnteredGameParameters
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const signupResponse = await deleteEnteredGame(data);

    if (signupResponse?.status === 'error') {
      return await Promise.reject(signupResponse);
    }

    if (signupResponse?.status === 'success') {
      dispatch(submitDeleteEnteredAsync(data.enteredGameId));
    }
  };
};

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
