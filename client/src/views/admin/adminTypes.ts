import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";
import { SignupQuestion } from "shared/typings/models/settings";

export interface SubmitGetSettingsPayload {
  hiddenGames: readonly Game[];
  appOpen: boolean;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy;
}
