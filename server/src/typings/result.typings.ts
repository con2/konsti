import mongoose from 'mongoose';
import { Game } from 'shared/typings/models/game';
import { SelectedGame, User } from 'shared/typings/models/user';
import { Result } from 'shared/typings/models/result';

export interface ResultDoc extends Result, mongoose.Document {
  algorithm: string;
  message: string;
}

export interface UserSignup {
  username: string;
  signedGames: readonly SelectedGame[];
}

export interface PlayerAssignmentResult {
  results: readonly Result[];
  message: string;
  algorithm: string;
  status: string;
}

export interface ResultsCollectionEntry {
  startTime: string;
  results: readonly Result[];
  message: string;
  algorithm: string;
}

export interface AssignmentStrategyResult {
  results: readonly Result[];
  message: string;
}

export interface RunRandomAndPadgInput {
  signedGames: readonly Game[];
  playerGroups: readonly User[][];
  allPlayers: readonly User[];
  numberOfIndividuals: Number;
  numberOfGroups: Number;
}
