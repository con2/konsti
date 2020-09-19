import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';

export const SUBMIT_GET_USER_GAMES = 'SUBMIT_GET_USER_GAMES';
export const SUBMIT_UPDATE_FAVORITES = 'SUBMIT_UPDATE_FAVORITES';

export interface SubmitGetUserAsync {
  type: typeof SUBMIT_GET_USER_GAMES;
  enteredGames: readonly Signup[];
  favoritedGames: readonly Game[];
  signedGames: readonly Signup[];
}

export interface SubmitUpdateFavoritesAsync {
  type: typeof SUBMIT_UPDATE_FAVORITES;
  favoritedGames: readonly Game[];
}

export type MyGamesActionTypes =
  | SubmitGetUserAsync
  | SubmitUpdateFavoritesAsync;
