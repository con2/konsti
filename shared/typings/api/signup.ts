import { SignedGame } from 'shared/typings/models/user';

export interface PostSignupResponse {
  message: string;
  signedGames: readonly SignedGame[];
  status: 'success';
}

export interface PostSignupTimeResponse {
  message: string;
  signupTime: string;
  status: 'success';
}
