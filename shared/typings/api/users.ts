import { UserGames } from 'client/typings/user.typings';

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
