import { Game } from 'shared/typings/models/game';
import { SelectedGame } from 'shared/typings/models/user';

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}
