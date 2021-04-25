import mongoose from 'mongoose';
import { Game } from 'shared/typings/models/game';
import { EnteredGame, SignedGame, User } from 'shared/typings/models/user';

export interface ResultDoc extends Result, mongoose.Document {
  algorithm: string;
  message: string;
}

export interface Result {
  username: string;
  enteredGame: EnteredGame;
}

export interface Signup {
  username: string;
  signedGames: readonly SignedGame[];
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
