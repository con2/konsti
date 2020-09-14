import mongoose from 'mongoose';
import { Record, String, Static } from 'runtypes';

export interface FeedbackDoc extends Feedback, mongoose.Document {}

export const FeedbackRuntype = Record({
  gameId: String,
  feedback: String,
});

export type Feedback = Static<typeof FeedbackRuntype>;
