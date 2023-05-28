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
}
