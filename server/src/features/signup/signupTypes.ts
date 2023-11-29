import mongoose from "mongoose";
import { Game } from "shared/types/models/game";

export interface UserSignup {
  username: string;
  priority: number;
  time: string;
  message: string;
}

export interface Signup {
  game: Game;
  userSignups: readonly UserSignup[];
  count?: number;
}

export interface SignupDoc extends Signup, mongoose.Document {}
