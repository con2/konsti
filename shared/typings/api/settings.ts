import { Game } from 'shared/typings/models/game';

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
}

export interface PostToggleAppOpenResponse {
  appOpen: boolean;
  message: string;
  status: 'success';
}
