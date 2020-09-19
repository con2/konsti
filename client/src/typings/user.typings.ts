import { Game } from 'typings/game.typings';

export interface Signup {
  gameDetails: Game;
  priority: number;
  time: string;
}

export interface SignupData {
  username: string;
  selectedGames: readonly Signup[];
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

export enum UserGroup {
  user = 'user',
  admin = 'admin',
  help = 'help',
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
  enteredGames: readonly Signup[];
  favoritedGames: readonly Game[];
  signedGames: readonly Signup[];
}

export interface UpdateUserResponse {
  status: 'success';
}

export interface PostSignupResponse {
  message: string;
  signedGames: Signup[];
  status: 'success';
}

export interface PostLoginResponse {
  groupCode: string;
  jwt: string;
  message: string;
  serial: string;
  status: 'success';
  userGroup: UserGroup;
  username: string;
}

export interface GetUserBySerialResponse {
  games: Game[];
  message: string;
  serial: string;
  status: 'success';
  username: string;
}

export interface PostRegistrationResponse {
  message: string;
  password: string;
  status: 'success';
  username: string;
}

export interface GetUserResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: 'success';
  username: string;
}

export interface PostFavoriteResponse {
  favoritedGames: Game[];
  message: string;
  status: 'success';
}
