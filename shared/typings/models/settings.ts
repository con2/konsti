import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";

export interface Settings {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
  signupMessages: SignupMessage[];
  signupStrategy: SignupStrategy;
}

export interface SignupMessage {
  gameId: string;
  message: string;
}
