import { Signup } from 'typings/user.typings';

export interface Result {
  username: string;
  enteredGame: Signup;
}

export interface PostPlayerAssignmentResponse {
  message: string;
  resultMessage: string;
  results: Result[];
  startTime: string;
  status: 'success';
}

export interface GetResultsResponse {
  message: string;
  results: Result[];
  startTime: string;
  status: 'success';
}
