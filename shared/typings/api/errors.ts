export interface ApiResult {
  status: "success";
}

export interface ApiError {
  errorId: string;
  message: string;
  status: "error";
}

export enum MongoDbError {
  UNKNOWN_ERROR = "unknownError",
  GAME_NOT_FOUND = "gameNotFound",
  NO_HIDDEN_GAMES = "noHiddenGames",
  USER_NOT_FOUND = "userNotFound",
  SIGNUP_QUESTION_NOT_FOUND = "signupQuestionNotFound",
  SIGNUP_NOT_FOUND = "signupNotFound",
}

export enum KompassiError {
  UNKNOWN_ERROR = "unknownError",
  NO_PROGRAM_ITEMS = "noProgramItems",
  INVALID_RESPONSE = "invalidResponse",
}

export enum AssignmentError {
  UNKNOWN_ERROR = "unknownError",
}
