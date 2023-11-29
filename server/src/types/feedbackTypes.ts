import mongoose from "mongoose";
import { Feedback } from "shared/types/models/feedback";

export interface FeedbackDoc extends Feedback, mongoose.Document {}
