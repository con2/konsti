import { Game } from 'shared/typings/models/game';
import { SelectedGame } from 'shared/typings/models/user';

export const SUBMIT_GET_USER_GAMES = 'SUBMIT_GET_USER_GAMES';
export const SUBMIT_UPDATE_FAVORITES = 'SUBMIT_UPDATE_FAVORITES';

export interface SubmitGetUserAsync {
  type: typeof SUBMIT_GET_USER_GAMES;
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}

export interface SubmitUpdateFavoritesAsync {
  type: typeof SUBMIT_UPDATE_FAVORITES;
  favoritedGames: readonly Game[];
}

export type MyGamesActionTypes =
  | SubmitGetUserAsync
  | SubmitUpdateFavoritesAsync;
