export interface ApiResult {
  status: "success";
  message: string;
}

export interface ApiError {
  status: "error";
  errorId: string;
  message: string;
}

export enum MongoDbError {
  UNKNOWN_ERROR = "unknownError",
  PROGRAM_ITEM_NOT_FOUND = "programItemNotFound",
  NO_HIDDEN_PROGRAM_ITEMS = "noHiddenProgramItems",
  USER_NOT_FOUND = "userNotFound",
  SIGNUP_QUESTION_NOT_FOUND = "signupQuestionNotFound",
  SIGNUP_NOT_FOUND = "signupNotFound",
  SETTINGS_NOT_FOUND = "settingsNotFound",
  USER_OR_LOG_ITEM_NOT_FOUND = "userOrLogItemNotFound",
}

export enum KompassiError {
  UNKNOWN_ERROR = "unknownError",
  NO_PROGRAM_ITEMS = "noProgramItems",
  INVALID_RESPONSE = "invalidResponse",
}

export enum KompassiLoginError {
  UNKNOWN_ERROR = "unknownError",
}

export enum AssignmentError {
  UNKNOWN_ERROR = "unknownError",
}

export enum BcryptError {
  UNKNOWN_ERROR = "unknownError",
}
