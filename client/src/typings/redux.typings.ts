import { Game } from 'shared/typings/models/game';
import { GroupMember } from 'client/typings/group.typings';
import { Result } from 'shared/typings/models/result';
import { appReducer } from 'client/utils/store';
import { SelectedGame, UserGroup } from 'shared/typings/models/user';

export interface AdminState {
  hiddenGames: readonly Game[];
  signupTime: string;
  testTime: string;
  appOpen: boolean;
  responseMessage: string;
}

export interface AllGamesState {
  games: readonly Game[];
}

export interface LoginState {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  groupMembers: readonly GroupMember[];
}

export interface MyGamesState {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}

export interface ResultsState {
  result: readonly Result[];
  startTime: string;
}

export interface SignupState {
  signupTime: string;
  selectedGames: readonly SelectedGame[];
  unsavedChanges: boolean;
}

export interface LocalStorageState {
  login: { jwt: string };
}

export type RootState = ReturnType<typeof appReducer>;
