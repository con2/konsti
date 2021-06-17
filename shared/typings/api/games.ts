import { Game } from 'shared/typings/models/game';

export interface numPlayersInfo {
  gameId: string;
  numPlayers: number;
}

export interface PostGamesResponse {
  message: string;
  status: 'success';
  games: Game[];
}

export interface GetGamesResponse {
  message: string;
  status: 'success';
  games: Game[];
  numPlayers: numPlayersInfo[];
}
