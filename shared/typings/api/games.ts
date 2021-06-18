import { GameWithPlayerCount } from 'server/typings/game.typings';
import { Game } from 'shared/typings/models/game';

export interface NumPlayersInGame {
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
  games: GameWithPlayerCount[];
}
