import { Status } from 'shared/typings/api/games';
import { SignedGame } from 'server/typings/user.typings';

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
