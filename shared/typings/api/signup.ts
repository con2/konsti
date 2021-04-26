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
