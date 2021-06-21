import { Game } from 'shared/typings/models/game';
import { SignupMessage } from 'shared/typings/models/settings';

export interface PostHiddenResponse {
  hiddenGames: readonly Game[];
  message: string;
  status: 'success';
}

export interface GetSettingsResponse {
  appOpen: boolean;
  hiddenGames: readonly Game[];
  message: string;
  signupTime: string;
  status: 'success';
  signupMessages: readonly SignupMessage[];
}

export interface PostToggleAppOpenResponse {
  appOpen: boolean;
  message: string;
  status: 'success';
}

export interface PostSignupMessageResponse {
  signupMessages: readonly SignupMessage[];
  message: string;
  status: 'success';
}
