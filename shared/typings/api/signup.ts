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

export interface EnteredGameRequest {
  username: string;
  enteredGameId: string;
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
