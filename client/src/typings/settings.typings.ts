import { Game } from 'shared/typings/game';

export interface Settings {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}
