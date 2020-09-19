import { Game } from 'typings/game.typings';

export const SUBMIT_UPDATE_HIDDEN = 'SUBMIT_UPDATE_HIDDEN';
export const SUBMIT_GET_SETTINGS = 'SUBMIT_GET_SETTINGS';
export const SUBMIT_SELECT_SIGNUP_TIME = 'SUBMIT_SELECT_SIGNUP_TIME';
export const SUBMIT_SET_TEST_TIME = 'SUBMIT_SET_TEST_TIME';
export const SUBMIT_TOGGLE_APP_OPEN = 'SUBMIT_TOGGLE_APP_OPEN';
export const SUBMIT_RESPONSE_MESSAGE = 'SUBMIT_RESPONSE_MESSAGE';

export interface SubmitUpdateHiddenAsync {
  type: typeof SUBMIT_UPDATE_HIDDEN;
  hiddenGames: readonly Game[];
}

export interface SubmitGetSettingsAsync {
  type: typeof SUBMIT_GET_SETTINGS;
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}

export interface SubmitSignupTimeAsync {
  type: typeof SUBMIT_SELECT_SIGNUP_TIME;
  signupTime: string;
}

export interface SubmitSetTestTime {
  type: typeof SUBMIT_SET_TEST_TIME;
  testTime: string;
}

export interface SubmitToggleAppOpenAsync {
  type: typeof SUBMIT_TOGGLE_APP_OPEN;
  appOpen: boolean;
}

export interface SubmitResponseMessageAsync {
  type: typeof SUBMIT_RESPONSE_MESSAGE;
  responseMessage: string;
}

export type AdminActionTypes =
  | SubmitUpdateHiddenAsync
  | SubmitGetSettingsAsync
  | SubmitSignupTimeAsync
  | SubmitSetTestTime
  | SubmitToggleAppOpenAsync
  | SubmitResponseMessageAsync;
