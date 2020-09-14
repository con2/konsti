import { Game } from 'typings/game.typings';

export interface Settings {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}
