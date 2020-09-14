export interface Feedback {
  feedback: string;
  gameId: string;
}

export interface PostFeedbackResponse {
  message: string;
  status: 'success';
}
