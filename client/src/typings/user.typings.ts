import { Game } from 'shared/typings/models/game';
import { SelectedGame, UserGroup } from 'shared/typings/models/user';

export interface SignupData {
  username: string;
  selectedGames: readonly SelectedGame[];
  signupTime: string;
}

export interface FavoriteData {
  username: string;
  favoritedGames: readonly Game[];
}

export interface LoginFormFields {
  username?: string;
  password?: string;
  jwt?: string;
}

export interface LoginData {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
}

export interface RegistrationFormFields {
  password: string;
  registerDescription: boolean;
  serial: string;
  username: string;
}

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
