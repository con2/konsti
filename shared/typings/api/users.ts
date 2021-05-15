import { Game } from 'shared/typings/models/game';
import { SelectedGame } from 'shared/typings/models/user';

export interface GetUserResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: 'success';
  username: string;
}

export interface PostUserResponse {
  message: string;
  password: string;
  status: 'success';
  username: string;
}

export interface GetUserBySerialResponse {
  games: UserGames;
  message: string;
  serial: string;
  status: 'success';
  username: string;
}

interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
