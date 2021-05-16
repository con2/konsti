import { Record, String, Static } from 'runtypes';
import { SelectedGame } from 'shared/typings/models/user';

export interface PostSignupResponse {
  message: string;
  signedGames: readonly SelectedGame[];
  status: 'success';
}

export interface PostSignupTimeResponse {
  message: string;
  signupTime: string;
  status: 'success';
}

export interface SignupData {
  username: string;
  selectedGames: readonly SelectedGame[];
  signupTime: string;
}

export interface PostEnteredGameResponse {
  message: string;
  status: 'success';
}

export interface DeleteEnteredGameResponse {
  message: string;
  status: 'success';
}

export const PostEnteredGameParametersRuntype = Record({
  username: String,
  enteredGameId: String,
  startTime: String,
});

export type PostEnteredGameParameters = Static<
  typeof PostEnteredGameParametersRuntype
>;

export const DeleteEnteredGameParametersRuntype = Record({
  username: String,
  enteredGameId: String,
  startTime: String,
});

export type DeleteEnteredGameParameters = Static<
  typeof DeleteEnteredGameParametersRuntype
>;
