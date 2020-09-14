import { Signup } from 'typings/user.typings';

export const SUBMIT_SIGNUP_TIME = 'SUBMIT_SELECT_SIGNUPTIME';
export const SUBMIT_SELECTED_GAMES = 'SUBMIT_SELECTED_GAMES';
export const SUBMIT_SIGNED_GAMES = 'SUBMIT_SIGNED_GAMES';
export const UPDATE_UNSAVED_CHANGES_STATUS = 'UPDATE_UNSAVED_CHANGES_STATUS';

export interface SubmitSignupAsync {
  type: typeof SUBMIT_SIGNED_GAMES;
  signedGames: readonly Signup[];
}

export interface SubmitSignupTime {
  type: typeof SUBMIT_SIGNUP_TIME;
  signupTime: string;
}

export interface SubmitSelectedGames {
  type: typeof SUBMIT_SELECTED_GAMES;
  selectedGames: readonly Signup[];
}

export interface UpdateUnsavedChangesStatus {
  type: typeof UPDATE_UNSAVED_CHANGES_STATUS;
  unsavedChanges: boolean;
}

export type SignupActionTypes =
  | SubmitSignupAsync
  | SubmitSignupTime
  | SubmitSelectedGames
  | UpdateUnsavedChangesStatus;
