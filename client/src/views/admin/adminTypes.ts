import { Game } from 'shared/typings/models/game';

export interface SubmitGetSettingsPayload {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}
