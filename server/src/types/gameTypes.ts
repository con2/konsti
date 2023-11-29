import mongoose from "mongoose";
import { Game } from "shared/types/models/game";

export interface GameDoc extends Game, mongoose.Document {}
