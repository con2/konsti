import { Game } from 'shared/typings/models/game';

export const SUBMIT_GET_GAMES = 'SUBMIT_GET_GAMES';

export interface SubmitGetGamesAsync {
  type: typeof SUBMIT_GET_GAMES;
  games: readonly Game[];
}

export type AllGamesActionTypes = SubmitGetGamesAsync;
