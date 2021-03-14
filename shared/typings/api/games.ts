import { Game } from 'shared/typings/models/game';

type Status = 'success' | 'error';

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
