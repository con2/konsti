import mongoose from 'mongoose';
import { Game } from 'shared/typings/game';

export interface SettingsDoc extends Settings, mongoose.Document {}

export interface Settings {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}
