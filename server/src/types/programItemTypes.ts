import mongoose from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";

export interface ProgramItemDoc extends ProgramItem, mongoose.Document {}
