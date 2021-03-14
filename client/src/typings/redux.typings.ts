import { Game } from 'shared/typings/game';
import { GroupMember } from 'client/typings/group.typings';
import { Signup, UserGroup } from 'client/typings/user.typings';
import { Result } from 'client/typings/result.typings';
import { appReducer } from 'client/utils/store';

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
  enteredGames: readonly Signup[];
  favoritedGames: readonly Game[];
  signedGames: readonly Signup[];
}

export interface ResultsState {
  result: readonly Result[];
  startTime: string;
}

export interface SignupState {
  signupTime: string;
  selectedGames: readonly Signup[];
  unsavedChanges: boolean;
}

export interface LocalStorageState {
  login: { jwt: string };
}

export type RootState = ReturnType<typeof appReducer>;
