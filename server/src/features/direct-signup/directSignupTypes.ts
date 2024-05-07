import mongoose from "mongoose";
import { Game } from "shared/types/models/game";

export interface UserDirectSignup {
  username: string;
  priority: number;
  time: string;
  message: string;
}

export interface DirectSignupsForProgramItem {
  game: Game;
  userSignups: readonly UserDirectSignup[];
  count?: number;
}

export interface DirectSignupDoc
  extends DirectSignupsForProgramItem,
    mongoose.Document {}
