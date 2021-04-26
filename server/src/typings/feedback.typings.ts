import mongoose from 'mongoose';
import { Feedback } from 'shared/typings/models/feedback';

export interface FeedbackDoc extends Feedback, mongoose.Document {}
