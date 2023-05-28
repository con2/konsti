export interface ApiResult {
  status: "success";
}

export interface ApiError {
  errorId: string;
  message: string;
  status: "error";
}
