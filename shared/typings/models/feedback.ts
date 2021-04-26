import { Record, String, Static } from 'runtypes';

export const FeedbackRuntype = Record({
  gameId: String,
  feedback: String,
});

export type Feedback = Static<typeof FeedbackRuntype>;
