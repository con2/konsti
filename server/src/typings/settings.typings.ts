import mongoose from 'mongoose';
import { Game } from 'common/typings/game';

export interface SettingsDoc extends Settings, mongoose.Document {}

export interface Settings {
  hiddenGames: readonly Game[];
  signupTime: string;
  appOpen: boolean;
}
