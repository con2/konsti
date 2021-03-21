import { Game } from 'shared/typings/models/game';

export type Status = 'success' | 'error';

export interface PostGamesResponse {
  message: string;
  status: Status;
  games: Game[];
}

export interface GetGamesResponse {
  message: string;
  status: Status;
  games: Game[];
}
