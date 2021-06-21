import { Game } from 'shared/typings/models/game';
import { SignupMessage } from 'shared/typings/models/settings';

export interface SubmitGetSettingsPayload {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
  signupMessages: readonly SignupMessage[];
}
