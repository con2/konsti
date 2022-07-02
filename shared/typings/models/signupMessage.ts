import { ApiError } from "shared/typings/api/errors";

export interface SignupMessage {
  gameId: string;
  username: string;
  message: string;
  private: boolean;
}

export interface GetSignupMessagesResponse {
  signupMessages: SignupMessage[];
  message: string;
  status: "success";
}

export interface GetSignupMessagesError extends ApiError {
  errorId: "unknown";
}
