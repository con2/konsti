import { Game } from 'shared/typings/models/game';
import { SelectedGame, UserGroup } from 'shared/typings/models/user';

export interface LoginData {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
}

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
