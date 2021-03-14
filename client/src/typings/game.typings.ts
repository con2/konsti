import { Game } from 'shared/typings/game';

export interface DnDUpdatedPositions {
  availableGames?: readonly Game[];
  selectedGames?: readonly Game[];
}

export interface DnDMove {
  index: number;
  droppableId: string;
}

export interface PostGamesUpdateResponse {
  games: Game[];
  message: string;
  status: 'success';
}

export interface GetGamesResponse {
  games: Game[];
  message: string;
  status: 'success';
}

export interface PostHiddenResponse {
  hiddenGames: Game[];
  message: string;
  status: 'success';
}
