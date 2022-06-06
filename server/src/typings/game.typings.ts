import mongoose from "mongoose";
import { Game } from "shared/typings/models/game";

export interface GameDoc extends Game, mongoose.Document {}

export interface GameWithPlayerCount {
  game: Game;
  players: number;
}
