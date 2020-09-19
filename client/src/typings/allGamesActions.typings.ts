import { Game } from 'typings/game.typings';

export const SUBMIT_GET_GAMES = 'SUBMIT_GET_GAMES';

export interface SubmitGetGamesAsync {
  type: typeof SUBMIT_GET_GAMES;
  games: readonly Game[];
}

export type AllGamesActionTypes = SubmitGetGamesAsync;
